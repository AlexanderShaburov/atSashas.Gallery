from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import hashlib
import shutil
from ..deps import require_admin_token
from ..storage import UPLOAD_DIR

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_MIME = {
    "image/png", "image/jpeg", "image/webp", "image/avif",
    "application/pdf", "image/svg+xml"
}
MAX_BYTES = 50 * 1024 * 1024 # 50 MB

def _digest(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 *1024), b""):
            h.update(chunk)
    return h.hexdigest()

@router.post("", dependencies=[Depends(require_admin_token)])
async def upload(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, 
                            detail=f"Unsupported type: {file.content_type}")
    # temporal path:
    tmp = UPLOAD_DIR / f"._tmp_{file.filename}"
    total = 0
    with tmp.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_BYTES:
                tmp.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    sha = _digest(tmp)
    ext = Path(file.filename).suffix.lower()
    final = UPLOAD_DIR / f"{sha}{ext}"
    if not final.exists():
        shutil.move(tmp, final)
    else:
        tmp.unlink(missing_ok=True)
    
    # Relative front path:
    rel = f"/files/uploads/{final.name}"
    return {"ok": True, 
            "bytes": total, 
            "sha256": sha, 
            "path": rel, 
            "type": file.content_type
            }
@router.get("/by-name/{name}")
def get_aploaded_byName(name: str):
    p = UPLOAD_DIR / name
    if not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p)
