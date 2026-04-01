# /app/routers/media_items/media_items.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.auth.dependencies import get_current_user
from app.models.media_items import CreateMediaItemRequest, MediaItemCatalog, MediaItemData
from app.repos.media_item_repo import media_item_repo, generate_media_item_id

# Public router - no auth, read-only
public_router = APIRouter(prefix="/public/media-items", tags=["public-media-items"])

# Admin router - requires auth
admin_router = APIRouter(
    prefix="/admin/media-items",
    tags=["admin-media-items"],
    dependencies=[Depends(get_current_user)],
)


@public_router.get("", response_model=MediaItemCatalog)
async def get_media_items_public() -> MediaItemCatalog:
    return await media_item_repo.get_all()


@public_router.get("/{item_id}", response_model=MediaItemData)
async def get_media_item_public(item_id: str) -> MediaItemData:
    item = await media_item_repo.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"MediaItem not found: {item_id}")
    return item


@admin_router.get("", response_model=MediaItemCatalog)
async def list_media_items() -> MediaItemCatalog:
    return await media_item_repo.get_all()


@admin_router.get("/{item_id}", response_model=MediaItemData)
async def get_media_item(item_id: str) -> MediaItemData:
    item = await media_item_repo.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"MediaItem not found: {item_id}")
    return item


@admin_router.post("", response_model=MediaItemData, status_code=201)
async def create_media_item(body: CreateMediaItemRequest) -> MediaItemData:
    item_id = generate_media_item_id()
    item = MediaItemData(id=item_id, **body.model_dump())
    async with media_item_repo.session() as catalog:
        catalog.items[item_id] = item
        catalog.order.append(item_id)
        catalog.version += 1
    return item


@admin_router.put("/{item_id}", response_model=MediaItemData)
async def upsert_media_item(item_id: str, body: MediaItemData) -> MediaItemData:
    if body.id != item_id:
        raise HTTPException(
            status_code=400,
            detail="MediaItem id in body must match path param",
        )
    async with media_item_repo.session() as catalog:
        if item_id not in catalog.items and item_id not in catalog.order:
            catalog.order.append(item_id)
        catalog.items[item_id] = body
        catalog.version += 1
    return body


@admin_router.delete("/{item_id}", status_code=204)
async def delete_media_item(item_id: str) -> Response:
    async with media_item_repo.session() as catalog:
        if item_id not in catalog.items:
            raise HTTPException(status_code=404, detail=f"MediaItem not found: {item_id}")
        del catalog.items[item_id]
        if item_id in catalog.order:
            catalog.order.remove(item_id)
        catalog.version += 1
    return Response(status_code=204)
