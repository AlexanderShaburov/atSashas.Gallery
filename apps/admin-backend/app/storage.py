from pathlib import Path
from logging import getLogger
from typing import Any
import json
from .settings import settings

logger = getLogger(__name__)


BASE = Path(settings.storage_dir)

JSON_DIR = BASE / settings.json_data.replace("/", "")
UPLOAD_DIR = BASE / settings.upload_media_dir.replace("/", "")
logger.info(f"BASE: {BASE}; UPLOAD_DIR {UPLOAD_DIR}")
JSON_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def json_path(key: str) -> Path:
    safe = "".join(ch for ch in key if ch.isalnum() or ch in ("-", "_"))
    return JSON_DIR / f"{safe}.json"


def read_json(key: str) -> Any:
    logger.info(f"JSON read_json reached with {key} key.")
    p = json_path(key)
    logger.info(f"calculated path is: {p.as_posix()}")
    if not p.exists():
        return None
    logger.info(f"JSON read_json obtained {p} path.")
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(key: str, data: Any) -> None:
    p = json_path(key)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
