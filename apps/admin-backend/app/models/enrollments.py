# /app/models/enrollments.py
#
# Shared types for event status, enrollment status, payment status, and
# enrollment records.
#
# Originally housed in app.models.events alongside the retired EventData
# model; relocated here during the EventPage canonicalization migration
# (see knowledge/plans/plan--event--collapse-into-event-page.md Phase 5).
#
# Phase 1 of the admin enrollments plan extends this model with a process
# status, contact/note fields, and provenance tracking, while preserving
# backward compatibility with records authored before the change (see
# knowledge/plans/plan--admin--event-enrollments-management.md §Phase 1).

from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    closed = "closed"


class EnrollmentStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled_by_user = "cancelled_by_user"
    cancelled_by_admin = "cancelled_by_admin"
    no_show = "no_show"
    attended = "attended"


class PaymentStatus(str, Enum):
    unpaid = "unpaid"
    paid = "paid"


# Legacy paymentStatus values that appeared on pre-Phase-1 records. Both
# collapse into `unpaid` — the simpler dual-status model carries any
# paid/failed nuance on the enrollment status field or an admin note.
_LEGACY_PAYMENT_STATUS_TO_UNPAID = frozenset({"pending", "failed"})


CreatedBy = Literal["public", "admin"]


class Enrollment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    # email / phone are individually optional; at least one is required at
    # the request layer (`EnrollRequest`). The storage model itself stays
    # permissive so legacy records with `email: ""` still load cleanly.
    email: Optional[str] = None
    phone: Optional[str] = None
    note: Optional[str] = None
    status: EnrollmentStatus = EnrollmentStatus.pending
    paymentStatus: PaymentStatus = PaymentStatus.unpaid
    createdBy: CreatedBy = "public"
    createdAt: str  # ISO datetime
    updatedAt: str  # ISO datetime
    stripeSessionId: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _hydrate_legacy_record(cls, data: Any) -> Any:
        """Normalize pre-Phase-1 records on read.

        No-op for dicts that already conform to the new shape. Applies:
          - paymentStatus 'pending' / 'failed' → 'unpaid'
          - missing status     → 'pending'
          - missing createdBy  → 'public'
          - missing updatedAt  → mirror createdAt (if present)

        Missing createdAt is not injected here — that is a real data error
        and should surface as a validation failure.
        """
        if not isinstance(data, dict):
            return data

        legacy_payment = data.get("paymentStatus")
        if legacy_payment in _LEGACY_PAYMENT_STATUS_TO_UNPAID:
            data["paymentStatus"] = PaymentStatus.unpaid.value

        if "status" not in data:
            data["status"] = EnrollmentStatus.pending.value
        if "createdBy" not in data:
            data["createdBy"] = "public"
        if "updatedAt" not in data and "createdAt" in data:
            data["updatedAt"] = data["createdAt"]

        return data


class EnrollRequest(BaseModel):
    """Public-side enrollment payload.

    Phase 2 adds optional `phone` and `note` and enforces an
    "email OR phone" contact rule. The fullName remains mandatory.
    Input validation is the source of truth; the storage `Enrollment`
    model itself stays permissive for legacy records.
    """

    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def _require_email_or_phone(self) -> "EnrollRequest":
        has_email = bool((self.email or "").strip())
        has_phone = bool((self.phone or "").strip())
        if not (has_email or has_phone):
            raise ValueError("At least one of email or phone is required")
        return self
