# /app/models/event_pages.py
# EventPageData — polymorphic event page model.
# Uses extra="allow" because different presets have different fields.

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, ConfigDict

from app.models.common import Localized, Money
from app.models.enrollments import EventStatus, Enrollment


class EventPreset(str, Enum):
    workshop = "workshop"
    pleinAir = "pleinAir"
    exhibition = "exhibition"
    minimal = "minimal"


class CaptionedWork(BaseModel):
    image: str
    title: Localized
    medium: Optional[Localized] = None


# ---------------------------------------------------------------------------
# CTA Action — Phase 1 of the CTA & Registration system.
# Discriminated union on "kind". Frontend types live in
# apps/frontend/src/entities/event/ctaAction.ts and must stay in sync.
# ---------------------------------------------------------------------------


class CtaActionExternal(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["external"]
    url: str = ""


class CtaActionRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["register"]
    paid: bool = False
    capacity: Optional[int] = None


class CtaActionInquiry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["inquiry"]
    toEmail: Optional[str] = None


CtaAction = Union[CtaActionExternal, CtaActionRegister, CtaActionInquiry]


class EventPageData(BaseModel):
    """Polymorphic event page. Extra fields allowed per preset.

    Per `decision--event--event-page-is-canonical-event.md` this is the
    canonical event entity. Enrollments live on this record.
    """
    model_config = ConfigDict(extra="allow")

    id: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    preset: EventPreset
    status: EventStatus = EventStatus.draft
    title: Localized = Field(default_factory=Localized)
    description: Localized = Field(default_factory=Localized)
    location: Localized = Field(default_factory=Localized)
    ctaLabel: Localized = Field(default_factory=Localized)
    price: Optional[Money] = None
    enrollments: dict[str, Enrollment] = Field(default_factory=dict)
    eventId: Optional[str] = None  # Deprecated legacy field; see migration plan.
    ctaAction: Optional[CtaAction] = Field(default=None, discriminator="kind")


class EventPageCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str = ""
    pages: dict[str, EventPageData] = Field(default_factory=dict)
