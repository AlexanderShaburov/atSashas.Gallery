# app/routers/art/catalog.py


from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from logging import getLogger
from app.deps import require_admin_token
from app.services.catalog_service import update_catalog
from app.repos.catalog_repo import catalog_repo
from app.repos.collection_repo import block_collection_repo
from app.repos.stream_repo import stream_repo
from app.models.shipment import ArtShipmentModel
from app.models.block_collection import GalleryBlock
from typing import List


router = APIRouter(
    prefix="/art",
    tags=["catalog"],
    dependencies=[Depends(get_current_user)],  # Require authentication
)
logger = getLogger(__name__)


@router.post("/catalog/update", dependencies=[Depends(require_admin_token)])
async def updater(payload: ArtShipmentModel):
    logger.info("/update endpoint yanked")
    async with catalog_repo.session() as catalog:
        await update_catalog(catalog, payload)
    return {"status": "ok"}


@router.get("/dependencies/{id}")
async def get_dependencies(id: str):
    """
    Find all blocks and streams that depend on the given art item.
    Returns lists of block IDs and stream IDs that use this art item.
    """
    dependent_blocks: List[str] = []
    dependent_streams: List[str] = []

    # 1. Find all blocks that use this art item
    async with block_collection_repo.session() as collection:
        for block_id, block in collection.blocks.items():
            # Only gallery blocks can contain art items
            if isinstance(block, GalleryBlock):
                # Check if any item in this block references our art item
                for item in block.items:
                    if item.artId == id:
                        dependent_blocks.append(block_id)
                        break  # Found it, no need to check other items in this block

    # 2. Find all streams that use any of the dependent blocks
    if dependent_blocks:
        streams_index = await stream_repo.list_index()

        # For each stream in the index, we need to load it and check its blockIds
        for stream_item in streams_index.streams:
            try:
                stream = await stream_repo.get_stream(stream_item.streamId)

                # Check if this stream contains any of the dependent blocks
                for block_id in dependent_blocks:
                    if block_id in stream.blockIds:
                        dependent_streams.append(stream.streamId)
                        break  # Found one, no need to check other blocks
            except FileNotFoundError:
                # Stream in index but file missing - skip it
                logger.warning(
                    f"Stream {stream_item.streamId} in index but file not found"
                )
                continue

    logger.info(
        f"Art item {id} dependencies: {len(dependent_blocks)} blocks, "
        f"{len(dependent_streams)} streams"
    )

    return {
        "artItemId": id,
        "blocks": dependent_blocks,
        "streams": dependent_streams,
        "summary": {
            "totalBlocks": len(dependent_blocks),
            "totalStreams": len(dependent_streams),
        },
    }


# this endpoint should delete item from catalog and everywere it is in use
# replace it with "artItem deleted" endcup.
@router.delete("/catalog/{id}", dependencies=[Depends(require_admin_token)])
async def delete_art_item(id):
    """
    Delete an ArtItem from the catalog (items dict + order list).
    No block/stream checks for now.
    """
    async with catalog_repo.session() as catalog:
        # 1. Check item exists
        if id not in catalog.items:
            raise HTTPException(
                status_code=404, detail=f"ArtItem '{id}' not found"
            )
        # 2. Remove form dict
        del catalog.items[id]

        # 3. Remove from order list if present
        if id in catalog.order:
            catalog.order = [x for x in catalog.order if x != id]
        # 4. Touch version + updatedAt
        catalog._touch()

    return {"status": "delete endcup"}
