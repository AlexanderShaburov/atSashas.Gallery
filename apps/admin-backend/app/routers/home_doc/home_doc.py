# app/routers/home_doc/home_doc.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.models.home_doc import HomeDoc
from app.repos.home_doc_repo import home_doc_repo

# Public router (no authentication required)
public_router = APIRouter(prefix="/public", tags=["public-home"])

# Admin router (authentication required)
admin_router = APIRouter(
    prefix="/admin/home",
    tags=["admin-home"],
    dependencies=[Depends(get_current_user)],
)


# --- Public Endpoints ---


@public_router.get("/home", response_model=HomeDoc)
async def get_home_public() -> HomeDoc:
    """
    Get the HomeDoc for public rendering.
    Falls back to public_stream.json migration if home.json doesn't exist.
    """
    return await home_doc_repo.get()


# --- Admin Endpoints ---


@admin_router.get("", response_model=HomeDoc)
async def get_home_admin() -> HomeDoc:
    """Get HomeDoc (admin endpoint)."""
    return await home_doc_repo.get()


@admin_router.put("", response_model=HomeDoc)
async def update_home(body: HomeDoc) -> HomeDoc:
    """
    Full replace update of HomeDoc.
    Requires version match for optimistic concurrency.
    """
    try:
        return await home_doc_repo.update(body)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
