# app/routers/streams_router.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from pydantic import BaseModel, Field

from app.models.streams import StreamData, StreamIndexItem, StreamStatus
from app.repos.home_doc_repo import home_doc_repo
from app.repos.stream_repo import StreamRepo

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
    Return streams currently featured on the public homepage, in HomeDoc order.
    No authentication required.

    After the Homepage Editor cutover, "published" is defined as "referenced by
    a streamRef in HomeDoc" — HomeDoc is the sole homepage visibility source.
    """
    try:
        doc = await home_doc_repo.get()
        featured_ids = [
            it.streamId for it in doc.items if it.kind == "streamRef"
        ]

        index = await repo.list_index()
        id_to_item = {item.streamId: item for item in index.streams}
        return [id_to_item[sid] for sid in featured_ids if sid in id_to_item]
    except Exception as e:
        # If HomeDoc or index fails to load, return empty list.
        print(f"Error loading featured streams: {e}")
        return []


@public_router.get("/by-ids", response_model=list[StreamIndexItem])
async def get_streams_by_ids(
    ids: str = Query("", min_length=0),
) -> list[StreamIndexItem]:
    """
    Return stream index items by their IDs (comma-separated).
    Used by the Home page to resolve streamRef items.
    No authentication required.
    """
    stream_ids = [sid.strip() for sid in ids.split(",") if sid.strip()]
    if not stream_ids:
        return []

    index = await repo.list_index()
    id_to_item = {item.streamId: item for item in index.streams}
    return [id_to_item[sid] for sid in stream_ids if sid in id_to_item]


@public_router.get("/{stream_id}", response_model=StreamData)
async def get_published_stream(stream_id: str) -> StreamData:
    """Get a single stream by ID (public, no auth required)."""
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
    Check whether a stream is currently featured on the public homepage.
    Returns dependency information so the admin UI can warn before deletion.
    """
    is_on_homepage = False

    try:
        doc = await home_doc_repo.get()
        is_on_homepage = any(
            it.kind == "streamRef" and it.streamId == stream_id for it in doc.items
        )
    except Exception:
        # If HomeDoc fails to load, assume not referenced.
        pass

    return {
        "streamId": stream_id,
        "isOnHomepage": is_on_homepage,
        "dependencies": {
            "homepage": is_on_homepage,
        },
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
