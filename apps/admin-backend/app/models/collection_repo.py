import asyncio
from pathlib import Path
import json
from typing import AsyncIterator
from contextlib import asynccontextmanager

from app.models.block_collections import BlocksCollectionJSON


class BlockCollectionRepo:
    def __init__(self, collection: Path):
        self._path = collection
        self._lock = asyncio.Lock()

    def _load(self) -> BlocksCollectionJSON:
        if not self._path.exists():
            return BlocksCollectionJSON.create_empty()
        return BlocksCollectionJSON.load_from_file(self._path)

    def _save(self, collection_data: BlocksCollectionJSON) -> None:
        data = BlocksCollectionJSON.validate_data(collection_data)
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2,
            )

    @asynccontextmanager
    async def session(self) -> AsyncIterator[BlocksCollectionJSON]:
        async with self._lock:
            collection = self._load()
            try:
                yield collection
            finally:
                self._save(collection)
