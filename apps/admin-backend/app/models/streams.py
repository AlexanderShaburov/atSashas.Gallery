# app/models/streams.py
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class StreamStatus(str, Enum):
    draft = "draft"
    ready = "ready"
    archived = "archived"


class StreamData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    streamId: str = Field(
        min_length=1
    )  # Slug/id, also filename (e.g., "home")
    title: str = Field(min_length=1)  # Human-readable name shown in the UI
    status: StreamStatus = StreamStatus.draft

    tags: List[str] = Field(
        default_factory=list
    )  # For filtering in the stream list
    description: str = ""  # Optional short text for admin/SEO

    version: int = Field(ge=1, default=1)  # Optimistic concurrency
    createdAt: str  # ISO string
    updatedAt: str  # ISO string

    blockIds: List[str] = Field(
        default_factory=list
    )  # Ordered list of block IDs


class StreamIndexItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    streamId: str
    title: str
    status: StreamStatus
    tags: List[str] = Field(default_factory=list)
    description: str
    updatedAt: str


class StreamsIndex(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str
    streams: List[StreamIndexItem] = Field(default_factory=list)
