# /app/routers/event_pages/event_pages.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.auth.dependencies import get_current_user
from app.models.event_pages import EventPageCatalog, EventPageData
from app.repos.event_page_repo import event_page_repo

public_router = APIRouter(prefix="/public/event-pages", tags=["public-event-pages"])

admin_router = APIRouter(
    prefix="/admin/event-pages",
    tags=["admin-event-pages"],
    dependencies=[Depends(get_current_user)],
)


@public_router.get("", response_model=EventPageCatalog)
async def get_event_pages_public() -> EventPageCatalog:
    catalog = await event_page_repo.get_all()
    # Public listing returns only scheduled (published) event pages
    public_pages = {
        pid: page
        for pid, page in catalog.pages.items()
        if page.status == "scheduled"
    }
    return EventPageCatalog(
        version=catalog.version,
        updatedAt=catalog.updatedAt,
        pages=public_pages,
    )


@public_router.get("/{page_id}")
async def get_event_page_public(page_id: str) -> EventPageData:
    page = await event_page_repo.get_page(page_id)
    if not page or page.status != "scheduled":
        raise HTTPException(status_code=404, detail=f"Event page not found: {page_id}")
    return page


@admin_router.get("", response_model=EventPageCatalog)
async def list_event_pages() -> EventPageCatalog:
    return await event_page_repo.get_all()


@admin_router.get("/{page_id}")
async def get_event_page(page_id: str) -> EventPageData:
    page = await event_page_repo.get_page(page_id)
    if not page:
        raise HTTPException(status_code=404, detail=f"Event page not found: {page_id}")
    return page


@admin_router.post("", status_code=201)
async def create_event_page(body: EventPageData) -> EventPageData:
    async with event_page_repo.session() as catalog:
        catalog.pages[body.id] = body
        catalog.version += 1
    return body


@admin_router.put("/{page_id}")
async def upsert_event_page(page_id: str, body: EventPageData) -> EventPageData:
    if body.id != page_id:
        raise HTTPException(
            status_code=400,
            detail="Event page id in body must match path param",
        )
    async with event_page_repo.session() as catalog:
        catalog.pages[page_id] = body
        catalog.version += 1
    return body


@admin_router.delete("/{page_id}", status_code=204)
async def delete_event_page(page_id: str) -> Response:
    async with event_page_repo.session() as catalog:
        if page_id not in catalog.pages:
            raise HTTPException(status_code=404, detail=f"Event page not found: {page_id}")
        del catalog.pages[page_id]
        catalog.version += 1
    return Response(status_code=204)
