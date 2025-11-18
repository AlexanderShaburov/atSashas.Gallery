from fastapi import APIRouter, Depends
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
