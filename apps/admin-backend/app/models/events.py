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


class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"


class Enrollment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    email: str
    createdAt: str  # ISO datetime
    paymentStatus: PaymentStatus = PaymentStatus.pending
    stripeSessionId: Optional[str] = None


class EventData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    title: Localized
    description: Optional[Localized] = None
    dateTime: str  # ISO datetime string
    durationMinutes: Optional[int] = None
    location: str = ""
    mapUrl: Optional[str] = None
    price: Optional[Money] = None
    status: EventStatus = EventStatus.draft
    streamSlug: Optional[str] = None
    enrollments: dict[str, Enrollment] = Field(default_factory=dict)


class CreateEventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1)
    title: Localized
    description: Optional[Localized] = None
    dateTime: str
    durationMinutes: Optional[int] = None
    location: str = ""
    mapUrl: Optional[str] = None
    price: Optional[Money] = None
    status: EventStatus = EventStatus.draft
    streamSlug: Optional[str] = None


class EnrollRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=1)
    email: str = Field(min_length=1)


class EventCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str
    events: dict[str, EventData] = Field(default_factory=dict)
