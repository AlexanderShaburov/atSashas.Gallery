# app/routers/streams_router.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.streams import StreamData, StreamIndexItem, StreamStatus
from app.repos.stream_repo import StreamRepo

router = APIRouter(prefix="/admin/streams", tags=["admin-streams"])
repo = StreamRepo()


class CreateStreamBody(
    StreamData.__class__
):  # not used; placeholder to avoid confusion
    pass


# Keep Create as a small DTO (not full StreamData)


class CreateStreamRequest(BaseModel):
    streamId: str = Field(min_length=1)
    title: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    description: str = ""


@router.get("", response_model=list[StreamIndexItem])
async def list_streams(
    status: StreamStatus | None = Query(default=None),
    tag: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> list[StreamIndexItem]:
    index = await repo.list_index()
    items = index.streams

    if status is not None:
        items = [s for s in items if s.status == status]
    if tag:
        items = [s for s in items if tag in (s.tags or [])]
    if q:
        ql = q.lower().strip()
        items = [
            s
            for s in items
            if ql in s.streamId.lower() or ql in s.title.lower()
        ]

    # Sort by updatedAt desc (ISO strings sort well if consistent)
    items.sort(key=lambda s: s.updatedAt, reverse=True)
    return items


@router.post("", response_model=StreamData)
async def create_stream(body: CreateStreamRequest) -> StreamData:
    try:
        return await repo.create_stream(
            stream_id=body.streamId,
            title=body.title,
            tags=body.tags,
            description=body.description,
        )
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{stream_id}", response_model=StreamData)
async def get_stream(stream_id: str) -> StreamData:
    try:
        return await repo.get_stream(stream_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Stream not found: {stream_id}"
        )


@router.put("/{stream_id}", response_model=StreamData)
async def update_stream(stream_id: str, body: StreamData) -> StreamData:
    if body.streamId != stream_id:
        raise HTTPException(
            status_code=400, detail="streamId in body must match path param"
        )

    try:
        return await repo.update_stream(body)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Stream not found: {stream_id}"
        )
    except ValueError as e:
        # Version mismatch
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{stream_id}", response_model=dict)
async def delete_stream(
    stream_id: str,
    hard: bool = Query(default=False),
) -> dict:
    try:
        if hard:
            await repo.hard_delete_stream(stream_id)
        else:
            await repo.archive_stream(stream_id)
        return {"ok": True}
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Stream not found: {stream_id}"
        )
