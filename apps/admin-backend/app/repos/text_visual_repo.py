# /app/repos/text_visual_repo.py

import asyncio
import json
import secrets
import string
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Optional

from app.models.text_visuals import TextVisualCatalog, TextVisualData
from app.settings import settings


def generate_text_visual_id() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"tv-{today}-{suffix}"


class TextVisualRepo:
    def __init__(self) -> None:
        self._path = (
            Path(settings.storage_root)
            / settings.json_data.strip("/")
            / "text_visuals"
            / "catalog.json"
        )
        self._lock = asyncio.Lock()

    def _load(self) -> TextVisualCatalog:
        if not self._path.exists():
            now = datetime.now(timezone.utc).isoformat()
            return TextVisualCatalog(version=1, updatedAt=now, order=[], items={})
        with self._path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return TextVisualCatalog.model_validate(data)

    def _save(self, catalog: TextVisualCatalog) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        catalog.updatedAt = datetime.now(timezone.utc).isoformat()
        data = catalog.model_dump(mode="json")
        tmp_path = self._path.with_suffix(self._path.suffix + ".tmp")
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp_path.replace(self._path)

    @asynccontextmanager
    async def session(self) -> AsyncIterator[TextVisualCatalog]:
        async with self._lock:
            catalog = self._load()
            try:
                yield catalog
            finally:
                self._save(catalog)

    async def get_all(self) -> TextVisualCatalog:
        async with self._lock:
            return self._load()

    async def get_item(self, item_id: str) -> Optional[TextVisualData]:
        async with self._lock:
            catalog = self._load()
            return catalog.items.get(item_id)


text_visual_repo = TextVisualRepo()
