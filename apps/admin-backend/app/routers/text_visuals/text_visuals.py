# /app/routers/text_visuals/text_visuals.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.auth.dependencies import get_current_user
from app.models.text_visuals import CreateTextVisualRequest, TextVisualCatalog, TextVisualData
from app.repos.text_visual_repo import text_visual_repo, generate_text_visual_id

# Public router - no auth, read-only
public_router = APIRouter(prefix="/public/text-visuals", tags=["public-text-visuals"])

# Admin router - requires auth
admin_router = APIRouter(
    prefix="/admin/text-visuals",
    tags=["admin-text-visuals"],
    dependencies=[Depends(get_current_user)],
)


@public_router.get("", response_model=TextVisualCatalog)
async def get_text_visuals_public() -> TextVisualCatalog:
    return await text_visual_repo.get_all()


@public_router.get("/{item_id}", response_model=TextVisualData)
async def get_text_visual_public(item_id: str) -> TextVisualData:
    item = await text_visual_repo.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"TextVisual not found: {item_id}")
    return item


@admin_router.get("", response_model=TextVisualCatalog)
async def list_text_visuals() -> TextVisualCatalog:
    return await text_visual_repo.get_all()


@admin_router.get("/{item_id}", response_model=TextVisualData)
async def get_text_visual(item_id: str) -> TextVisualData:
    item = await text_visual_repo.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"TextVisual not found: {item_id}")
    return item


@admin_router.post("", response_model=TextVisualData, status_code=201)
async def create_text_visual(body: CreateTextVisualRequest) -> TextVisualData:
    item_id = generate_text_visual_id()
    item = TextVisualData(id=item_id, **body.model_dump())
    async with text_visual_repo.session() as catalog:
        catalog.items[item_id] = item
        catalog.order.append(item_id)
        catalog.version += 1
    return item


@admin_router.put("/{item_id}", response_model=TextVisualData)
async def upsert_text_visual(item_id: str, body: TextVisualData) -> TextVisualData:
    if body.id != item_id:
        raise HTTPException(
            status_code=400,
            detail="TextVisual id in body must match path param",
        )
    async with text_visual_repo.session() as catalog:
        if item_id not in catalog.items and item_id not in catalog.order:
            catalog.order.append(item_id)
        catalog.items[item_id] = body
        catalog.version += 1
    return body


@admin_router.delete("/{item_id}", status_code=204)
async def delete_text_visual(item_id: str) -> Response:
    async with text_visual_repo.session() as catalog:
        if item_id not in catalog.items:
            raise HTTPException(status_code=404, detail=f"TextVisual not found: {item_id}")
        del catalog.items[item_id]
        if item_id in catalog.order:
            catalog.order.remove(item_id)
        catalog.version += 1
    return Response(status_code=204)
