from fastapi import HTTPException
from app.models.art_item import ArtItem
from app.models.catalog import Catalog
from app.models.images_pipline import ImagesJSON

CATALOG_PATH = "./vault/json/catalog.json"


"""
   What has to do update_catalog function:
   PART 1 "Create propper imageObject":
      - detect what mode user use at the moment? "hopper" or "ready"?
      - in case of "hopper":
          - create fullsize image from the hopper (now simple copy, 
              but later check file format and size adn bring it to
              desiered if necessary)
          - create preview files and place them correctly
          - create propper ArtItem object
       - in case of "ready" check if image object is readable
           and pass it through, otherwise return error
           
    PART 2 "Check ArtItem validity, whatever it means
    PART 3  
        - get catalog.json
        - check if object with the ID exists and:
            - if not:
                - add object to catalog object.items;
                - isert artId to begining of catalog.order list
                - check object to concistency;
                - increase catalog version number
                - compare items number and order list length;
                - if averything ok save over existed else rise error;
            - if exists:
                - do the same except increasign order list;
"""


async def update_catalog(shipment: dict):
    cat = Catalog()
    #   Check kind of shipment: artItem or artGerm
    match shipment["images"]["kind"]:
        case "hopper":
            # If artGerm create propper images:
            url = shipment["images"]["hopper_src"].split("/")[-1]
            images = ImagesJSON.from_hopper(url, shipment["id"])

        case "ready":
            # If ready artItem translate to further processing
            images = shipment["images"]["image"]
        case _:
            raise HTTPException(
                status_code=422, detail="Incorrect shipment format."
            )

    #   Create new ArtItem object from received data:
    art_item = ArtItem(
        images=images,
        **{k: v for k, v in shipment.items() if k != "images"},
    )
    cat.add_or_update(art_item)
    cat.save_catalog()
    return {
        "ok": True,
        "catalogVersion": cat.catalogVersion,
        "updatedAt": cat.updatedAt,
    }
