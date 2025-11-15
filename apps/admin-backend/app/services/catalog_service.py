from app.models.art_item import ArtItem
from app.models.catalog import Catalog
from app.models.images_pipline import ImagesJSON

CATALOG_PATH = "./vault/json/catalog.json"


async def update_catalog(shipment: dict):
    cat = Catalog(CATALOG_PATH)

    match shipment['images']['kind']:
        case 'hopper':
            images = ImagesJSON.from_hopper(
                shipment["images"][hopper_src],
                
            )
        case 'ready':
        case _:  
    # здесь логика нормализации и обновления
    cat.save()
    return {
        "ok": True,
        "catalogVersion": cat.data["catalogVersion"],
        "updatedAt": cat.data["updatedAt"],
    }
