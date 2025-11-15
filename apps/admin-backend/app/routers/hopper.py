from fastapi import APIRouter
from logging import getLogger
from urllib.parse import quote
from ..storage import UPLOAD_DIR, BASE

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
    logger.info(f"root is: {str(root)}")
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
        response.append({"id": file_name, "src": f"{base_root}/{rel_quoted}"})
    logger.info(f"Hopper read with lingth {len(response)}")
    return response
