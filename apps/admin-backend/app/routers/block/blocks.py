import json
from logging import getLogger
from pathlib import Path
from fastapi import APIRouter, HTTPException, status

from app.storage import BLOCKS_DIR
from app.models.block_collections import BlocksCollectionJSON


logger = getLogger(__name__)
router = APIRouter(prefix="/blocks", tags=["blocks"])


@router.get("/content")
def blocks_content():
    exts = ["json"]
    logger.info("Blocks content called.")
    root = BLOCKS_DIR.resolve()
    if not root.is_dir():
        logger.info("Blocks library not is a dir")
        return
    logger.info(f"Blocks collection root is {str(root)}")
    files = root.rglob("*")
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
                "url": p,
                "name": next_coll.collectionName,
                "length": len(next_coll.blocks),
            }
        )
    logger.info(f"Blocks collection read with length {len(response)}")
    return response


@router.get("/collection/{id}")
async def get_collection(id: str) -> BlocksCollectionJSON:
    p = Path(BLOCKS_DIR) / id
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
    return BlocksCollectionJSON.load_from_file(p)
