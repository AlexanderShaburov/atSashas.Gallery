# /app/models/events.py

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.common import Localized, Money


class EventStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    closed = "closed"


class EventData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    title: Localized
    description: Optional[Localized] = None
    dateTime: str  # ISO datetime string
    durationMinutes: Optional[int] = None
    location: str = ""
    price: Optional[Money] = None
    status: EventStatus = EventStatus.draft
    streamSlug: Optional[str] = None


class CreateEventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1)
    title: Localized
    description: Optional[Localized] = None
    dateTime: str
    durationMinutes: Optional[int] = None
    location: str = ""
    price: Optional[Money] = None
    status: EventStatus = EventStatus.draft
    streamSlug: Optional[str] = None


class EventCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str
    events: dict[str, EventData] = Field(default_factory=dict)
