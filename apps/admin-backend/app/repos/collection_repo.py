# app/repos/block_collection_repo.py

import asyncio
import json
from typing import AsyncIterator
from contextlib import asynccontextmanager

from app.models.block_collection import BlockCollection
from app.storage import BLOCKS_DIR


class BlockCollectionRepo:
    def __init__(self) -> None:
        self._path = BLOCKS_DIR / "block_collection.json"
        self._lock = asyncio.Lock()

    def _load(self) -> BlockCollection:
        if not self._path.exists():
            return BlockCollection.create_empty()
        with self._path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return BlockCollection.model_validate(data)

    def _save(self, collection: BlockCollection) -> None:
        data = collection.model_dump(mode="json")
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2,
            )

    @asynccontextmanager
    async def session(self) -> AsyncIterator[BlockCollection]:
        async with self._lock:
            coll = self._load()
            try:
                yield coll
            finally:
                self._save(coll)


block_collection_repo = BlockCollectionRepo()
