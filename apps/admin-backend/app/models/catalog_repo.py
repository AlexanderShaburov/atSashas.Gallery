# catalog_repo.py
import asyncio
from app.settings import settings
from pathlib import Path
import json
from typing import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.models.catalog import Catalog


class CatalogRepo:
    def __init__(self):
        self._path = (
            Path(settings.storage_root)
            / settings.json_data.strip("/")
            / "catalog.json"
        )

        self._lock = asyncio.Lock()

    def _load(self) -> Catalog:
        if not self._path.exists():
            return Catalog(
                catalogVersion=1,
                updatedAt=datetime.now(timezone.utc).isoformat(),
                items={},
                order=[],
            )
        with self._path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return Catalog.model_validate(data)

    def _save(self, catalog: Catalog) -> None:
        data = catalog.model_dump(mode="utf-8")
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2,
            )

    @asynccontextmanager
    async def session(self) -> AsyncIterator[Catalog]:
        async with self._lock:
            catalog = self._load()
            try:
                yield catalog
            finally:
                self._save(catalog)


catalog_repo = CatalogRepo()
