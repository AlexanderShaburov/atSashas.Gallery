from fastapi import APIRouter, Depends
from logging import getLogger

from ..deps import require_admin_token
from ..services.catalog_service import update_catalog


router = APIRouter(prefix="/catalog", tags=["catalog"])
logger = getLogger(__name__)


@router.post("/update", dependencies=[Depends(require_admin_token)])
async def updater(shipment: dict):
    logger.info("/update endpoint yanked")
    return await update_catalog(shipment)
