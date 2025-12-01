import json
from logging import getLogger
from pathlib import Path
from fastapi import APIRouter, HTTPException, status

from app.storage import BLOCKS_DIR
from app.models.block_collections import BlocksCollectionJSON, CollectionSeed
from app.models.collection_repo import BlockCollectionRepo


logger = getLogger(__name__)
router = APIRouter(prefix="/block", tags=["block"])

# BLOCKS_DIR = /media/json/block_collection


@router.get("/content")
def blocks_content():
    logger.info("[Block/Content]: block/content called")
    exts = [".json"]
    logger.info("Blocks content called.")
    logger.info(
        f"We are going watch collection in the {str(BLOCKS_DIR)} directory"
    )
    root = BLOCKS_DIR.resolve()
    if not root.is_dir():
        logger.info("Blocks library not is a dir")
        return
    logger.info(f"Blocks collection root is {str(root)}")
    files = root.rglob("*")
    logger.info(f"Raw rglob at {str(BLOCKS_DIR)} is {files}")
    response: list[dict] = []
    for p in files:
        if not p.is_file():
            continue
        if p.suffix.lower() not in exts:
            continue

        with p.open("r", encoding="utf-8") as f:
            data = json.load(f)
            next_coll = BlocksCollectionJSON.validate_data(data)

        response.append(
            {
                "id": next_coll.collectionId,
                "url": p,
                "name": next_coll.collectionName,
                "length": len(next_coll.blocks),
            }
        )
    logger.info(f"Blocks collection read with length {len(response)}")
    return response


@router.get("/collection/{id}")
async def get_collection(id: str) -> BlocksCollectionJSON:
    p = Path(BLOCKS_DIR) / f"{id}.json"
    if not p.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection file '{id}' not found",
        )
    (_, e) = BlocksCollectionJSON.try_load_from_file(p)
    if not _:
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail=f"Error occure wile reading collection with {e}",
        )
    collection = BlocksCollectionJSON.load_from_file(p)

    logger.info(f"Collection with name: {collection.collectionName}")
    return collection


@router.put("/new_collection")
def create_collection(data: CollectionSeed):
    logger.info(
        f"Create collection called with {data.name} name, and {data.id} id"
    )
    new_collection = BlocksCollectionJSON.create_empty()
    new_collection.collectionName = data.name
    new_collection.collectionId = data.id
    session = BlockCollectionRepo(new_collection)
    session._save(new_collection)
    logger.info(
        f"New collection {data.name} successfuly created on {str(session._path)}"
    )
    return new_collection
