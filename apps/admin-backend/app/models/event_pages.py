# /app/models/event_pages.py
# EventPageData — polymorphic event page model.
# Uses extra="allow" because different presets have different fields.

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.common import Localized, Money
from app.models.events import EventStatus, Enrollment


class EventPreset(str, Enum):
    workshop = "workshop"
    pleinAir = "pleinAir"
    exhibition = "exhibition"
    minimal = "minimal"


class CaptionedWork(BaseModel):
    image: str
    title: Localized
    medium: Optional[Localized] = None


class EventPageData(BaseModel):
    """Polymorphic event page. Extra fields allowed per preset."""
    model_config = ConfigDict(extra="allow")

    id: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    preset: EventPreset
    status: EventStatus = EventStatus.draft
    title: Localized = Field(default_factory=Localized)
    description: Localized = Field(default_factory=Localized)
    location: Localized = Field(default_factory=Localized)
    ctaLabel: Localized = Field(default_factory=Localized)
    enrollments: dict[str, Enrollment] = Field(default_factory=dict)
    eventId: Optional[str] = None  # ID of the associated EventData for enrollment


class EventPageCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str = ""
    pages: dict[str, EventPageData] = Field(default_factory=dict)
