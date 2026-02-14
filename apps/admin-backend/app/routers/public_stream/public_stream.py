# app/routers/public_stream/public_stream.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from pydantic import BaseModel, Field

from app.models.public_stream import PublicStreamData
from app.repos.public_stream_repo import public_stream_repo
from app.repos.stream_repo import stream_repo

# Public router (no authentication required)
public_router = APIRouter(prefix="/public", tags=["public"])

# Admin router (authentication required)
admin_router = APIRouter(
    prefix="/admin/public_stream",
    tags=["admin-public-stream"],
    dependencies=[Depends(get_current_user)],  # Require authentication
)


# --- Public Endpoints (for frontend visitors) ---


@public_router.get("/public_stream", response_model=PublicStreamData)
async def get_public_stream() -> PublicStreamData:
    """
    Get the current PublicStream - list of streams visible to public
    No authentication required
    """
    return await public_stream_repo.get()


# --- Admin Endpoints (for admin dashboard) ---


class AddStreamRequest(BaseModel):
    streamId: str = Field(min_length=1)


class RemoveStreamRequest(BaseModel):
    streamId: str = Field(min_length=1)


class ReorderRequest(BaseModel):
    streamIds: list[str]


@admin_router.get("", response_model=PublicStreamData)
async def get_public_stream_admin() -> PublicStreamData:
    """Get PublicStream (admin endpoint)"""
    return await public_stream_repo.get()


@admin_router.post("", response_model=PublicStreamData)
async def update_public_stream(body: PublicStreamData) -> PublicStreamData:
    """
    Full replace update of PublicStream
    Requires version match for optimistic concurrency
    """
    try:
        return await public_stream_repo.update(body)
    except ValueError as e:
        # Version mismatch or validation error
        raise HTTPException(status_code=409, detail=str(e))
    except FileNotFoundError as e:
        # Referenced stream doesn't exist
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.post("/add", response_model=PublicStreamData)
async def add_stream_to_public(body: AddStreamRequest) -> PublicStreamData:
    """
    Add a stream to PublicStream
    Prevents duplicates automatically
    Requires stream to have a thumbnail
    """
    try:
        # Validate stream has thumbnail before publishing
        stream = await stream_repo.get_stream(body.streamId)
        if not stream.thumbnail:
            raise HTTPException(
                status_code=400,
                detail="Cannot publish stream without thumbnail. Please select a thumbnail first."
            )

        return await public_stream_repo.add_stream(body.streamId)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@admin_router.post("/remove", response_model=PublicStreamData)
async def remove_stream_from_public(body: RemoveStreamRequest) -> PublicStreamData:
    """
    Remove a stream from PublicStream
    """
    return await public_stream_repo.remove_stream(body.streamId)


@admin_router.post("/reorder", response_model=PublicStreamData)
async def reorder_public_stream(body: ReorderRequest) -> PublicStreamData:
    """
    Reorder streams in PublicStream
    Must contain exactly the same streams as current list
    """
    try:
        return await public_stream_repo.reorder(body.streamIds)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
