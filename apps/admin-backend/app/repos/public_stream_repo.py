# app/repos/public_stream_repo.py
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.public_stream import PublicStreamData
from app.settings import settings


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(path)


class PublicStreamRepo:
    def __init__(self) -> None:
        self._root = Path(settings.storage_root) / settings.json_data.strip("/")
        self._path = self._root / "public_stream.json"
        self._lock = asyncio.Lock()

    def _load_unlocked(self) -> PublicStreamData:
        if not self._path.exists():
            # Return empty PublicStream if file doesn't exist
            now = _utc_now_iso()
            return PublicStreamData(
                kind="PublicStream",
                version=1,
                streamIds=[],
                createdAt=now,
                updatedAt=now,
            )
        with self._path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return PublicStreamData.model_validate(data)

    def _save_unlocked(self, public_stream: PublicStreamData) -> None:
        payload = public_stream.model_dump(mode="json")
        _atomic_write_json(self._path, payload)

    async def get(self) -> PublicStreamData:
        """Get the current PublicStream"""
        async with self._lock:
            return self._load_unlocked()

    async def update(self, incoming: PublicStreamData) -> PublicStreamData:
        """
        Update PublicStream with optimistic concurrency control
        incoming.version must match stored.version
        """
        async with self._lock:
            stored = self._load_unlocked()

            if incoming.version != stored.version:
                raise ValueError(
                    f"Version mismatch: incoming={incoming.version}, stored={stored.version}"
                )

            # Validate that all stream IDs exist
            await self._validate_stream_ids(incoming.streamIds)

            now = _utc_now_iso()
            saved = incoming.model_copy(deep=True)
            saved.version = stored.version + 1
            saved.createdAt = stored.createdAt  # Preserve creation time
            saved.updatedAt = now

            self._save_unlocked(saved)
            return saved

    async def _validate_stream_ids(self, stream_ids: list[str]) -> None:
        """
        Validate that all referenced streams exist
        Raises FileNotFoundError if any stream doesn't exist
        """
        streams_root = self._root / "streams"
        for stream_id in stream_ids:
            stream_path = streams_root / f"{stream_id}.json"
            if not stream_path.exists():
                raise FileNotFoundError(f"Stream not found: {stream_id}")

    async def add_stream(self, stream_id: str) -> PublicStreamData:
        """Add a stream to PublicStream (prevents duplicates)"""
        async with self._lock:
            public_stream = self._load_unlocked()

            # Check if already present
            if stream_id in public_stream.streamIds:
                return public_stream

            # Validate stream exists
            await self._validate_stream_ids([stream_id])

            # Add to end
            public_stream.streamIds.append(stream_id)
            public_stream.version += 1
            public_stream.updatedAt = _utc_now_iso()

            self._save_unlocked(public_stream)
            return public_stream

    async def remove_stream(self, stream_id: str) -> PublicStreamData:
        """Remove a stream from PublicStream"""
        async with self._lock:
            public_stream = self._load_unlocked()

            # Remove if present
            if stream_id in public_stream.streamIds:
                public_stream.streamIds.remove(stream_id)
                public_stream.version += 1
                public_stream.updatedAt = _utc_now_iso()
                self._save_unlocked(public_stream)

            return public_stream

    async def reorder(self, stream_ids: list[str]) -> PublicStreamData:
        """
        Reorder streams in PublicStream
        Validates that the new list contains exactly the same streams as current
        """
        async with self._lock:
            public_stream = self._load_unlocked()

            # Validate same set of streams
            current_set = set(public_stream.streamIds)
            new_set = set(stream_ids)

            if current_set != new_set:
                raise ValueError(
                    "Reorder failed: new list must contain exactly the same streams"
                )

            public_stream.streamIds = list(stream_ids)
            public_stream.version += 1
            public_stream.updatedAt = _utc_now_iso()

            self._save_unlocked(public_stream)
            return public_stream


# Singleton instance
public_stream_repo = PublicStreamRepo()
