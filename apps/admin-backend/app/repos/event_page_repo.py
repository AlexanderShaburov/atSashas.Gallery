# /app/repos/event_page_repo.py

import asyncio
import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Optional

from app.models.event_pages import EventPageCatalog, EventPageData
from app.settings import settings


class EventPageRepo:
    def __init__(self) -> None:
        self._path = (
            Path(settings.storage_root)
            / settings.json_data.strip("/")
            / "event_pages"
            / "catalog.json"
        )
        self._lock = asyncio.Lock()

    def _load(self) -> EventPageCatalog:
        if not self._path.exists():
            now = datetime.now(timezone.utc).isoformat()
            return EventPageCatalog(version=1, updatedAt=now, pages={})
        with self._path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return EventPageCatalog.model_validate(data)

    def _save(self, catalog: EventPageCatalog) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        catalog.updatedAt = datetime.now(timezone.utc).isoformat()
        data = catalog.model_dump(mode="json")
        tmp_path = self._path.with_suffix(self._path.suffix + ".tmp")
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp_path.replace(self._path)

    @asynccontextmanager
    async def session(self) -> AsyncIterator[EventPageCatalog]:
        async with self._lock:
            catalog = self._load()
            try:
                yield catalog
            finally:
                self._save(catalog)

    async def get_all(self) -> EventPageCatalog:
        async with self._lock:
            return self._load()

    async def get_page(self, page_id: str) -> Optional[EventPageData]:
        async with self._lock:
            catalog = self._load()
            return catalog.pages.get(page_id)


event_page_repo = EventPageRepo()
