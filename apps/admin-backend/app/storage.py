from pathlib import Path
from typing import Any
import json
from .settings import settings
import os

BASE = Path(os.getenv("STORAGE_DIR", "/vault"))
JSON_DIR = BASE / "json"
UPLOAD_DIR = BASE / settings.storage_dir.replace("/", "")
JSON_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
print(f"BASE: {BASE}; UPLOAD_DIR {UPLOAD_DIR}")


def json_path(key: str) -> Path:
    safe = "".join(ch for ch in key if ch.isalnum() or ch in ("-", "_"))
    return JSON_DIR / f"{safe}.json"


def read_json(key: str) -> Any:
    print(f"JSON read_json reached with {key} key.")
    p = json_path(key)
    if not p.exists():
        return None
    print(f"JSON read_json obtained {p} path.")
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(key: str, data: Any) -> None:
    p = json_path(key)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
