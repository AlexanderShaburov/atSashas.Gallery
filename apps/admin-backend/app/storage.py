from pathlib import Path
from typing import Any
import json
from .settings import settings

BASE = Path(settings.storage_dir).resolve()
JSON_DIR = BASE / "json"
UPLOAD_DIR = BASE / "uploads"
JSON_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def json_path(key: str) -> Path:
    safe = "".join(ch for ch in key if ch.isalnum() or ch in ("-", '_'))
    return JSON_DIR / f"{safe}.json"

def read_json(key: str) -> Any:
    p = json_path(key)
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

def write_json(key: str, data: Any) -> None:
    p = json_path(key)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

