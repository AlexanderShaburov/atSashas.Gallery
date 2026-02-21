# app/routers/streams_router.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from pydantic import BaseModel, Field

from app.models.streams import StreamData, StreamIndexItem, StreamStatus
from app.repos.stream_repo import StreamRepo
from app.repos.public_stream_repo import public_stream_repo

# Public router (no authentication required)
public_router = APIRouter(
    prefix="/public/streams",
    tags=["public-streams"],
)

# Admin router (authentication required)
router = APIRouter(
    prefix="/admin/streams",
    tags=["admin-streams"],
    dependencies=[Depends(get_current_user)],  # Require authentication
)
repo = StreamRepo()


# --- Public Endpoints (for frontend visitors) ---


@public_router.get("/published", response_model=list[StreamIndexItem])
async def get_published_streams() -> list[StreamIndexItem]:
    """
    Get published streams from index (public endpoint, no auth required).
    Returns StreamIndexItem[] with thumbnails for streams in PublicStream.
    """
    try:
        # Get list of published stream IDs
        public_stream = await public_stream_repo.get()
        published_ids = set(public_stream.streamIds)

        # Get streams index
        index = await repo.list_index()

        # Filter to only published streams, preserve PublicStream order
        id_to_item = {item.streamId: item for item in index.streams}
        published_items = [
            id_to_item[stream_id]
            for stream_id in public_stream.streamIds
            if stream_id in id_to_item
        ]

        return published_items
    except Exception as e:
        # If PublicStream or index doesn't exist, return empty list
        print(f"Error loading published streams: {e}")
        return []


@public_router.get("/{stream_id}", response_model=StreamData)
async def get_published_stream(stream_id: str) -> StreamData:
    """Get a single stream — only if published (in PublicStream list)."""
    public_stream = await public_stream_repo.get()
    if stream_id not in public_stream.streamIds:
        raise HTTPException(
            status_code=404, detail=f"Stream not found: {stream_id}"
        )
    try:
        return await repo.get_stream(stream_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Stream not found: {stream_id}"
        )


# --- Admin Endpoints ---


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
    thumbnail: str = ""


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
            thumbnail=body.thumbnail,
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


@router.get("/{stream_id}/dependencies", response_model=dict)
async def get_stream_dependencies(stream_id: str) -> dict:
    """
    Check if a stream is published in PublicStream.
    Returns dependency information to warn before deletion.
    """
    is_published = False

    try:
        public_stream = await public_stream_repo.get()
        is_published = stream_id in public_stream.streamIds
    except Exception:
        # If PublicStream doesn't exist or fails to load, assume not published
        pass

    return {
        "streamId": stream_id,
        "isPublished": is_published,
        "dependencies": {
            "publicStream": is_published
        }
    }


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
