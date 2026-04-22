"""Unit tests for the Enrollment model backward-compatibility hydration.

Covers Phase 1 of
knowledge/plans/plan--admin--event-enrollments-management.md:

  - legacy record hydration (missing new fields default sensibly)
  - default value injection for status / createdBy / updatedAt
  - paymentStatus coercion for retired values ('pending', 'failed' → 'unpaid')
  - unknown / extra fields still rejected (extra='forbid' preserved)
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.enrollments import Enrollment, EnrollmentStatus, PaymentStatus


def _legacy_record(**overrides):
    """Build a dict shaped like a pre-Phase-1 stored record."""
    base = {
        "id": "enr-20250101-abc001",
        "fullName": "Alice Legacy",
        "email": "alice@example.com",
        "createdAt": "2025-01-01T00:00:00+00:00",
        # Pre-Phase-1 records have paymentStatus but no status / createdBy /
        # updatedAt. Default here is the retired 'pending' value so the
        # coercion path is exercised by default.
        "paymentStatus": "pending",
    }
    base.update(overrides)
    return base


def test_legacy_record_defaults_missing_fields():
    e = Enrollment.model_validate(_legacy_record())
    assert e.status == EnrollmentStatus.pending
    assert e.createdBy == "public"
    # Missing updatedAt mirrors createdAt rather than inventing a new timestamp.
    assert e.updatedAt == e.createdAt


def test_legacy_payment_status_pending_coerces_to_unpaid():
    e = Enrollment.model_validate(_legacy_record(paymentStatus="pending"))
    assert e.paymentStatus == PaymentStatus.unpaid


def test_legacy_payment_status_failed_coerces_to_unpaid():
    e = Enrollment.model_validate(_legacy_record(paymentStatus="failed"))
    assert e.paymentStatus == PaymentStatus.unpaid


def test_paid_payment_status_preserved_on_legacy_record():
    e = Enrollment.model_validate(_legacy_record(paymentStatus="paid"))
    assert e.paymentStatus == PaymentStatus.paid


def test_new_shape_record_roundtrips_unchanged():
    payload = {
        "id": "enr-20260422-new001",
        "fullName": "Bob New",
        "email": "bob@example.com",
        "phone": "+1-555-0101",
        "note": "Vegetarian meal",
        "status": "confirmed",
        "paymentStatus": "paid",
        "createdBy": "admin",
        "createdAt": "2026-04-22T10:00:00+00:00",
        "updatedAt": "2026-04-22T11:00:00+00:00",
    }
    e = Enrollment.model_validate(payload)
    assert e.status == EnrollmentStatus.confirmed
    assert e.paymentStatus == PaymentStatus.paid
    assert e.createdBy == "admin"
    assert e.phone == "+1-555-0101"
    assert e.note == "Vegetarian meal"
    # Explicit updatedAt is preserved — not overwritten by the hydration path.
    assert e.updatedAt == "2026-04-22T11:00:00+00:00"


def test_direct_construction_uses_field_defaults():
    """Constructing via kwargs still fills status / paymentStatus / createdBy."""
    e = Enrollment(
        id="enr-x",
        fullName="Carol",
        email="c@example.com",
        createdAt="2026-04-22T12:00:00+00:00",
        updatedAt="2026-04-22T12:00:00+00:00",
    )
    assert e.status == EnrollmentStatus.pending
    assert e.paymentStatus == PaymentStatus.unpaid
    assert e.createdBy == "public"
    assert e.phone is None
    assert e.note is None
    assert e.stripeSessionId is None


def test_extra_fields_still_rejected():
    """extra='forbid' must still catch typos / unknown keys."""
    with pytest.raises(ValidationError):
        Enrollment.model_validate(_legacy_record(unknownField="boom"))


def test_missing_createdAt_surfaces_as_validation_error():
    """Hydration does not invent createdAt — that's a real data error."""
    broken = _legacy_record()
    broken.pop("createdAt")
    with pytest.raises(ValidationError):
        Enrollment.model_validate(broken)


def test_all_new_enrollment_statuses_accepted():
    for value in (
        "pending",
        "confirmed",
        "cancelled_by_user",
        "cancelled_by_admin",
        "no_show",
        "attended",
    ):
        e = Enrollment.model_validate(_legacy_record(status=value))
        assert e.status.value == value
