# /app/models/enrollments.py
#
# Shared types for event status, payment status, and registration records.
# Originally housed in app.models.events alongside the retired EventData
# model; relocated here during the EventPage canonicalization migration
# (see knowledge/plans/plan--event--collapse-into-event-page.md Phase 5).

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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


class EnrollRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=1)
    email: str = Field(min_length=1)
