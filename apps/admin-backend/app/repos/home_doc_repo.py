# app/repos/home_doc_repo.py

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.home_doc import HomeDoc, HomeStreamRef
from app.settings import settings


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(path)


class HomeDocRepo:
    def __init__(self) -> None:
        self._root = Path(settings.storage_root) / settings.json_data.strip("/")
        self._path = self._root / "public" / "home.json"
        self._fallback_path = self._root / "public_stream.json"
        self._lock = asyncio.Lock()

    def _load_unlocked(self) -> HomeDoc:
        if self._path.exists():
            with self._path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            return HomeDoc.model_validate(data)

        # Fallback: migrate from public_stream.json
        if self._fallback_path.exists():
            return self._migrate_from_public_stream()

        # Empty HomeDoc
        now = _utc_now_iso()
        return HomeDoc(
            items=[],
            version=1,
            createdAt=now,
            updatedAt=now,
        )

    def _migrate_from_public_stream(self) -> HomeDoc:
        """Convert legacy PublicStreamData to HomeDoc on first read."""
        with self._fallback_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        stream_ids: list[str] = data.get("streamIds", [])
        items = [
            HomeStreamRef(kind="streamRef", streamSlug=sid)
            for sid in stream_ids
        ]

        now = _utc_now_iso()
        return HomeDoc(
            items=items,
            version=data.get("version", 1),
            createdAt=data.get("createdAt", now),
            updatedAt=data.get("updatedAt", now),
        )

    def _save_unlocked(self, doc: HomeDoc) -> None:
        payload = doc.model_dump(mode="json")
        _atomic_write_json(self._path, payload)

    async def get(self) -> HomeDoc:
        async with self._lock:
            return self._load_unlocked()

    async def update(self, incoming: HomeDoc) -> HomeDoc:
        async with self._lock:
            stored = self._load_unlocked()

            if incoming.version != stored.version:
                raise ValueError(
                    f"Version mismatch: incoming={incoming.version}, stored={stored.version}"
                )

            now = _utc_now_iso()
            saved = incoming.model_copy(deep=True)
            saved.version = stored.version + 1
            saved.createdAt = stored.createdAt
            saved.updatedAt = now

            self._save_unlocked(saved)
            return saved


# Singleton instance
home_doc_repo = HomeDocRepo()
