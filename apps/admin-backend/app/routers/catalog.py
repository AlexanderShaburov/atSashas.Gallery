from fastapi import APIRouter, Depends

from deps import require_admin_token
from services.catalog_service import update_catalog


router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.post("/update", dependencies=[Depends(require_admin_token)])
async def updater(shipment: dict):
    return await update_catalog(shipment)
