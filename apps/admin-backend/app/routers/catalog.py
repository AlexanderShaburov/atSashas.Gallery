from fastapi import APIRouter, Depends, HTTPException
from logging import getLogger
from app.deps import require_admin_token
from app.services.catalog_service import update_catalog
from app.models.catalog_repo import catalog_repo
from app.models.shipment import ArtShipmentModel


router = APIRouter(prefix="/catalog", tags=["catalog"])
logger = getLogger(__name__)


@router.post("/update", dependencies=[Depends(require_admin_token)])
async def updater(payload: ArtShipmentModel):
    logger.info("/update endpoint yanked")
    async with catalog_repo.session() as catalog:
        await update_catalog(catalog, payload)
    return {"status": "ok"}


# this endpoint should retrun lists of blocks and streams that use the artItem with id
@router.get("/dependencies/{id}")
async def get_dependencies(id):
    return {"blocks": [], "streams": []}


# this endpoint should delete item from catalog and everywere it is in use
# replace it with "artItem deleted" endcup.
@router.delete("/{id}", dependencies=[Depends(require_admin_token)])
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

        # TODO:
        # - scan blocks for this art_id
        # - scan streams for blocks containing it
        # - prevent deletion or return dependency list

    return {"status": "delete endcup"}
