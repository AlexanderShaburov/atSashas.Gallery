from fastapi import APIRouter
from urllib.parse import quote
from ..storage import UPLOAD_DIR

router = APIRouter(prefix="/hopper", tags=["hopper"])


@router.get("/content")
def hopper_content():
    print("Hopper content handler reached.")
    exts = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]
    base_root = "/media/hopper"
    root = UPLOAD_DIR.resolve()
    if not root.is_dir():
        return []
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
    return response
