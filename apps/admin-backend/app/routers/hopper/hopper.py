from fastapi import APIRouter, HTTPException, status
from pathlib import Path
from logging import getLogger
from urllib.parse import quote
import os

from app.settings import settings
from app.storage import UPLOAD_DIR, BASE


logger = getLogger(__name__)
router = APIRouter(prefix="/hopper", tags=["hopper"])


@router.get("/content")
def hopper_content():
    logger.info("Hopper content handler reached.")
    exts = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]
    base_root = "/media/hopper"
    logger.info(f"BASE is: {BASE}")
    logger.info(f"UPLOAD_DIR is: {UPLOAD_DIR}")
    root = UPLOAD_DIR.resolve()
    if not root.is_dir():
        logger.info("Root is not a dir!")
        return []
    logger.info(f"Hopper root is: {str(root)}")
    files = root.rglob("*")
    response: list[dict] = []
    for p in files:
        if not p.is_file():
            continue
        if p.suffix.lower() not in exts:
            continue
        file_name = p.name
        rel = p.relative_to(root).as_posix()
        rel_quoted = "/".join(quote(s) for s in rel.split("/"))
        response.append(
            {"id": file_name, "thumbUrl": f"{base_root}/{rel_quoted}"}
        )
    logger.info(f"Hopper read with length {len(response)}")
    return response


@router.delete("/{hopper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hopper_item(hopper_id: str):
    """
    Delete a single file from the Hopper folder.
    ID == file name (e.g. 'img_00123.avif')
    """
    logger.info(f"Hopper delete handler reached with filename: {hopper_id}")

    # Full path: storage_root / hopper_dir / file_id
    hopper_dir = Path(settings.storage_root) / settings.upload_media_dir.strip(
        "/"
    )
    file_path = hopper_dir / hopper_id
    logger.info(f"{file_path} be deleted immediately")

    #   1. Check file exists:
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hopper file '{hopper_id}' not found",
        )
    #   2. Delete file:
    try:
        os.remove(file_path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete hopper file {exc}",
        )
    return
