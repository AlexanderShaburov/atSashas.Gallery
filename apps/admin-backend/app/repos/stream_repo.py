# app/repos/stream_repo.py
from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Optional

from app.settings import settings
from app.models.streams import (
    StreamData,
    StreamsIndex,
    StreamIndexItem,
    StreamStatus,
)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(path)


class StreamRepo:
    def __init__(self) -> None:
        self._root = (
            Path(settings.storage_root)
            / settings.json_data.strip("/")
            / "streams"
        )
        self._index_path = self._root / "index.json"
        self._lock = asyncio.Lock()

    def _stream_path(self, stream_id: str) -> Path:
        return self._root / f"{stream_id}.json"

    def _load_index_unlocked(self) -> StreamsIndex:
        if not self._index_path.exists():
            now = _utc_now_iso()
            return StreamsIndex(version=1, updatedAt=now, streams=[])
        with self._index_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return StreamsIndex.model_validate(data)

    def _save_index_unlocked(self, index: StreamsIndex) -> None:
        index.updatedAt = _utc_now_iso()
        payload = index.model_dump(mode="json")
        _atomic_write_json(self._index_path, payload)

    def _load_stream_unlocked(self, stream_id: str) -> StreamData:
        path = self._stream_path(stream_id)
        if not path.exists():
            raise FileNotFoundError(f"Stream not found: {stream_id}")
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return StreamData.model_validate(data)

    def _save_stream_unlocked(self, stream: StreamData) -> None:
        path = self._stream_path(stream.streamId)
        payload = stream.model_dump(mode="json")
        _atomic_write_json(path, payload)

    def _generate_thumbnail(self, stream: StreamData) -> str:
        """
        Generate thumbnail URL from the first art item in the first gallery block.
        Returns empty string if no suitable thumbnail found.
        """
        if not stream.blockIds:
            return ""

        # Get first block ID
        first_block_id = stream.blockIds[0]

        # Load blocks collection
        blocks_path = (
            Path(settings.storage_root)
            / settings.json_data.strip("/")
            / "block_collection"
            / "block_collection.json"
        )

        if not blocks_path.exists():
            return ""

        try:
            with blocks_path.open("r", encoding="utf-8") as f:
                blocks_data = json.load(f)

            # Get the first block
            block = blocks_data.get("blocks", {}).get(first_block_id)
            if not block:
                return ""

            # Only process gallery blocks
            if block.get("blockKind") != "gallery":
                return ""

            # Get first item's artId
            items = block.get("items", [])
            if not items:
                return ""

            first_art_id = items[0].get("artId")
            if not first_art_id:
                return ""

            # Load catalog to get art item
            catalog_path = (
                Path(settings.storage_root)
                / settings.json_data.strip("/")
                / "art_catalog.json"
            )

            if not catalog_path.exists():
                return ""

            with catalog_path.open("r", encoding="utf-8") as f:
                catalog_data = json.load(f)

            # Get art item
            art_item = catalog_data.get("items", {}).get(first_art_id)
            if not art_item:
                return ""

            # Get preview image URL (prefer JPEG fallback)
            images = art_item.get("images", {})
            preview = images.get("preview", {})
            thumbnail_url = preview.get("jpeg", "")

            return thumbnail_url

        except (json.JSONDecodeError, KeyError, AttributeError):
            return ""

    def _upsert_index_item_unlocked(
        self, index: StreamsIndex, stream: StreamData
    ) -> None:
        # Generate thumbnail from first block's first art item
        thumbnail = self._generate_thumbnail(stream)

        # Upsert by streamId
        for i, item in enumerate(index.streams):
            if item.streamId == stream.streamId:
                index.streams[i] = StreamIndexItem(
                    streamId=stream.streamId,
                    title=stream.title,
                    thumbnail=thumbnail,
                    status=stream.status,
                    tags=list(stream.tags),
                    description=stream.description,
                    updatedAt=stream.updatedAt,
                )
                break
        else:
            index.streams.append(
                StreamIndexItem(
                    streamId=stream.streamId,
                    title=stream.title,
                    thumbnail=thumbnail,
                    status=stream.status,
                    tags=list(stream.tags),
                    description=stream.description,
                    updatedAt=stream.updatedAt,
                )
            )

    def _remove_index_item_unlocked(
        self, index: StreamsIndex, stream_id: str
    ) -> None:
        index.streams = [s for s in index.streams if s.streamId != stream_id]

    async def list_index(self) -> StreamsIndex:
        async with self._lock:
            return self._load_index_unlocked()

    async def get_stream(self, stream_id: str) -> StreamData:
        async with self._lock:
            return self._load_stream_unlocked(stream_id)

    async def create_stream(
        self,
        stream_id: str,
        title: str,
        tags: Optional[list[str]] = None,
        description: str = "",
    ) -> StreamData:
        async with self._lock:
            path = self._stream_path(stream_id)
            if path.exists():
                raise FileExistsError(f"Stream already exists: {stream_id}")

            now = _utc_now_iso()
            stream = StreamData(
                streamId=stream_id,
                title=title,
                status=StreamStatus.draft,
                tags=tags or [],
                description=description or "",
                version=1,
                createdAt=now,
                updatedAt=now,
                blockIds=[],
            )

            self._save_stream_unlocked(stream)

            index = self._load_index_unlocked()
            self._upsert_index_item_unlocked(index, stream)
            self._save_index_unlocked(index)

            return stream

    async def update_stream(self, incoming: StreamData) -> StreamData:
        """
        Full replace update with optimistic concurrency.
        incoming.version must match stored.version.
        We will increment version and update updatedAt on save.
        """
        async with self._lock:
            stored = self._load_stream_unlocked(incoming.streamId)

            if incoming.version != stored.version:
                raise ValueError(
                    f"Version mismatch for {incoming.streamId}: "
                    f"incoming={incoming.version}, stored={stored.version}"
                )

            now = _utc_now_iso()
            saved = incoming.model_copy(deep=True)
            saved.version = stored.version + 1
            saved.createdAt = stored.createdAt  # Preserve creation time
            saved.updatedAt = now

            self._save_stream_unlocked(saved)

            index = self._load_index_unlocked()
            self._upsert_index_item_unlocked(index, saved)
            self._save_index_unlocked(index)

            return saved

    async def archive_stream(self, stream_id: str) -> StreamData:
        async with self._lock:
            stream = self._load_stream_unlocked(stream_id)
            stream.status = StreamStatus.archived
            # No version check here; treat as admin action, still bump version
            stream.version = stream.version + 1
            stream.updatedAt = _utc_now_iso()

            self._save_stream_unlocked(stream)

            index = self._load_index_unlocked()
            self._upsert_index_item_unlocked(index, stream)
            self._save_index_unlocked(index)

            return stream

    async def hard_delete_stream(self, stream_id: str) -> None:
        async with self._lock:
            path = self._stream_path(stream_id)
            if path.exists():
                path.unlink()

            index = self._load_index_unlocked()
            self._remove_index_item_unlocked(index, stream_id)
            self._save_index_unlocked(index)


# Singleton instance
stream_repo = StreamRepo()
