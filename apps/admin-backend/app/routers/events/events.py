# /app/routers/events/events.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from fastapi.responses import Response

from app.models.events import CreateEventRequest, EventCatalog, EventData
from app.repos.event_repo import event_repo, generate_event_id

# Public router - no auth, read-only
public_router = APIRouter(prefix="/public/events", tags=["public-events"])

# Admin router - requires auth
admin_router = APIRouter(
    prefix="/admin/events",
    tags=["admin-events"],
    dependencies=[Depends(get_current_user)],
)


@public_router.get("", response_model=EventCatalog)
async def get_events_public() -> EventCatalog:
    return await event_repo.get_all()


@public_router.get("/{event_id}", response_model=EventData)
async def get_event_public(event_id: str) -> EventData:
    event = await event_repo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
    return event


@admin_router.get("", response_model=EventCatalog)
async def list_events() -> EventCatalog:
    return await event_repo.get_all()


@admin_router.get("/{event_id}", response_model=EventData)
async def get_event(event_id: str) -> EventData:
    event = await event_repo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
    return event


@admin_router.post("", response_model=EventData, status_code=201)
async def create_event(body: CreateEventRequest) -> EventData:
    event_id = generate_event_id()
    event = EventData(id=event_id, **body.model_dump())
    async with event_repo.session() as catalog:
        catalog.events[event_id] = event
        catalog.version += 1
    return event


@admin_router.put("/{event_id}", response_model=EventData)
async def upsert_event(event_id: str, body: EventData) -> EventData:
    if body.id != event_id:
        raise HTTPException(
            status_code=400,
            detail="Event id in body must match path param",
        )
    async with event_repo.session() as catalog:
        catalog.events[event_id] = body
        catalog.version += 1
    return body


@admin_router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str) -> Response:
    async with event_repo.session() as catalog:
        if event_id not in catalog.events:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
        del catalog.events[event_id]
        catalog.version += 1
    return Response(status_code=204)
