# /app/routers/enrollments/enrollments.py
#
# Enrollments router — canonical event entity is EventPage
# (`apps/admin-backend/app/models/event_pages.py`). See
# `knowledge/decisions/decision--event--event-page-is-canonical-event.md`
# and `knowledge/plans/plan--event--collapse-into-event-page.md`.
#
# Phase 2 preserves the public URL `/public/events/{id}/enroll` for contract
# compatibility; the URL rename to `/public/event-pages/{id}/enroll` ships in
# Phase 5 alongside the legacy code removal.

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.auth.dependencies import get_current_user
from app.models.enrollments import (
    Enrollment,
    EnrollmentStatus,
    EnrollRequest,
    PaymentStatus,
)
from app.repos.event_page_repo import event_page_repo, generate_enrollment_id
from app.services.stripe_service import create_checkout_session, verify_webhook_event


# ---------------------------------------------------------------------------
# Shared rules for the enrollments subsystem
# ---------------------------------------------------------------------------
#
# Business rules are centralized here so all mutation endpoints agree on the
# same definitions — see Phase 5A of
# knowledge/plans/plan--admin--event-enrollments-management.md.

# Cancelled records do not occupy capacity. `no_show` and `attended` are
# post-event states reached after the enrollment window closes; during the
# window, only cancellations free up a seat, so the active-count filter
# excludes just the two cancellation states.
_CANCELLED_STATES = frozenset(
    {
        EnrollmentStatus.cancelled_by_user,
        EnrollmentStatus.cancelled_by_admin,
    }
)

# States that admit no further transitions. Cancelled states are terminal
# by definition; `attended` and `no_show` are post-event outcomes and also
# terminal per the plan.
_TERMINAL_STATES = frozenset(
    {
        EnrollmentStatus.cancelled_by_user,
        EnrollmentStatus.cancelled_by_admin,
        EnrollmentStatus.no_show,
        EnrollmentStatus.attended,
    }
)

# Legal outbound transitions per enrollment status. Any edge not listed is
# rejected with 409 at the PATCH layer. Same-state patches are treated as
# idempotent no-ops by the endpoint (no updatedAt bump).
_LEGAL_TRANSITIONS: dict[EnrollmentStatus, frozenset[EnrollmentStatus]] = {
    EnrollmentStatus.pending: frozenset(
        {
            EnrollmentStatus.confirmed,
            EnrollmentStatus.cancelled_by_user,
            EnrollmentStatus.cancelled_by_admin,
        }
    ),
    EnrollmentStatus.confirmed: frozenset(
        {
            EnrollmentStatus.attended,
            EnrollmentStatus.no_show,
            EnrollmentStatus.cancelled_by_admin,
        }
    ),
    EnrollmentStatus.cancelled_by_user: frozenset(),
    EnrollmentStatus.cancelled_by_admin: frozenset(),
    EnrollmentStatus.attended: frozenset(),
    EnrollmentStatus.no_show: frozenset(),
}


def _is_legal_transition(
    current: EnrollmentStatus, target: EnrollmentStatus
) -> bool:
    """Same-state is a no-op (legal). Otherwise the target must be in the
    outbound set for `current`.
    """
    if current == target:
        return True
    return target in _LEGAL_TRANSITIONS.get(current, frozenset())


def _is_terminal(status: EnrollmentStatus) -> bool:
    return status in _TERMINAL_STATES


def _normalize_optional_text(value: str | None) -> str | None:
    """Trim whitespace and collapse empty strings to None."""
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def _has_contact(email: str | None, phone: str | None) -> bool:
    return bool((email or "").strip()) or bool((phone or "").strip())


def _get_event_capacity(page) -> int | None:
    """Return the registration capacity configured on the event's CTA, or None.

    Capacity is only defined for register-kind CTA actions; any other kind or
    a missing ctaAction yields None (i.e., unbounded, no enforcement).
    """
    cta = page.ctaAction
    if cta is None or cta.kind != "register":
        return None
    return cta.capacity


def _count_active_enrollments(page) -> int:
    return sum(
        1 for e in page.enrollments.values() if e.status not in _CANCELLED_STATES
    )


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

logger = logging.getLogger(__name__)

# Public router — no auth
public_router = APIRouter(prefix="/public", tags=["public-enrollments"])

# Admin router — auth required
admin_router = APIRouter(
    prefix="/admin",
    tags=["admin-enrollments"],
    dependencies=[Depends(get_current_user)],
)


class EnrollResponse(BaseModel):
    enrollmentId: str
    status: str  # "free" | "checkout"
    checkoutUrl: str | None = None


@public_router.post(
    "/events/{event_id}/enroll",
    response_model=EnrollResponse,
    status_code=201,
)
async def enroll(event_id: str, body: EnrollRequest) -> EnrollResponse:
    """Register a visitor for an event. `event_id` is an EventPage id."""
    async with event_page_repo.session() as catalog:
        page = catalog.pages.get(event_id)
        if not page:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")

        if page.status != "scheduled":
            raise HTTPException(
                status_code=400,
                detail=f"Enrollment not open (event status: {page.status.value})",
            )

        capacity = _get_event_capacity(page)
        if capacity is not None and _count_active_enrollments(page) >= capacity:
            raise HTTPException(status_code=409, detail="Event is at capacity")

        enrollment_id = generate_enrollment_id()
        now = datetime.now(timezone.utc).isoformat()

        has_price = page.price is not None and page.price.amount > 0

        # Normalize empty strings to None for optional contact/note fields.
        email = (body.email or "").strip() or None
        phone = (body.phone or "").strip() or None
        note = (body.note or "").strip() or None

        enrollment = Enrollment(
            id=enrollment_id,
            fullName=body.fullName,
            email=email,
            phone=phone,
            note=note,
            createdAt=now,
            updatedAt=now,
            createdBy="public",
            paymentStatus=PaymentStatus.unpaid if has_price else PaymentStatus.paid,
        )

        page.enrollments[enrollment_id] = enrollment
        catalog.version += 1

    if has_price:
        try:
            session = create_checkout_session(page, enrollment_id)
            return EnrollResponse(
                enrollmentId=enrollment_id,
                status="checkout",
                checkoutUrl=session.url,
            )
        except Exception as exc:
            logger.error("Stripe checkout session creation failed: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="Payment service unavailable",
            ) from exc
    else:
        return EnrollResponse(
            enrollmentId=enrollment_id,
            status="free",
        )


@public_router.post("/stripe/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_event(payload, sig_header)
    except Exception as exc:
        logger.warning("Stripe webhook signature verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    if event.type == "checkout.session.completed":
        session_data = event.data.object
        enrollment_id = session_data.get("metadata", {}).get("enrollment_id")
        # Metadata key remains `event_id` for Stripe-side compatibility; the
        # value is an EventPage id post-migration.
        event_id = session_data.get("metadata", {}).get("event_id")
        stripe_session_id = session_data.get("id")

        if enrollment_id and event_id:
            try:
                async with event_page_repo.session() as catalog:
                    page = catalog.pages.get(event_id)
                    if page and enrollment_id in page.enrollments:
                        page.enrollments[enrollment_id].paymentStatus = PaymentStatus.paid
                        page.enrollments[enrollment_id].stripeSessionId = stripe_session_id
                        catalog.version += 1
                        logger.info(
                            "Enrollment %s paid for event %s",
                            enrollment_id,
                            event_id,
                        )
            except Exception:
                logger.exception(
                    "Failed to update enrollment %s for event %s",
                    enrollment_id,
                    event_id,
                )

    return JSONResponse(content={"received": True})


@admin_router.get("/events/{event_id}/enrollments")
async def list_enrollments(event_id: str) -> list[Enrollment]:
    page = await event_page_repo.get_page(event_id)
    if not page:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
    return list(page.enrollments.values())


# ---------------------------------------------------------------------------
# Phase 3 of knowledge/plans/plan--admin--event-enrollments-management.md
# Top-level admin list of event occurrences with per-event aggregates.
# ---------------------------------------------------------------------------


class EnrollmentOverviewRow(BaseModel):
    """Per-event aggregate row for the admin enrollments list screen."""

    eventPageId: str
    title: str
    dateStart: str | None = None
    status: str  # event status: draft | scheduled | closed
    capacity: int | None = None
    totalCount: int
    paidCount: int
    cancelledCount: int


class EnrollmentsDetailEvent(BaseModel):
    """Event header payload for the admin enrollments detail page (Phase 4)."""

    id: str
    title: str
    dateStart: str | None = None
    status: str
    capacity: int | None = None


class EnrollmentsDetailResponse(BaseModel):
    event: EnrollmentsDetailEvent
    enrollments: list[Enrollment]


@admin_router.get("/enrollments/overview")
async def enrollments_overview() -> list[EnrollmentOverviewRow]:
    """Return per-event enrollment aggregates derived from event_page_repo.

    No filtering or sorting — the client handles upcoming/past partitioning
    and sort order. Counting rules match the plan §Phase 3:
      - totalCount:      all enrollments
      - paidCount:       paymentStatus == 'paid'
      - cancelledCount:  status in {cancelled_by_user, cancelled_by_admin}

    Capacity is populated only when the event's ctaAction is a register
    action with a capacity set; otherwise null (unbounded).
    """
    catalog = await event_page_repo.get_all()
    rows: list[EnrollmentOverviewRow] = []
    for event_id, page in catalog.pages.items():
        enrollments = page.enrollments
        total = len(enrollments)
        paid = sum(
            1 for e in enrollments.values() if e.paymentStatus == PaymentStatus.paid
        )
        cancelled = sum(
            1 for e in enrollments.values() if e.status in _CANCELLED_STATES
        )

        capacity = _get_event_capacity(page)
        title = page.title.en or ""
        date_start = getattr(page, "dateStart", None)

        rows.append(
            EnrollmentOverviewRow(
                eventPageId=event_id,
                title=title,
                dateStart=date_start if isinstance(date_start, str) else None,
                status=page.status.value,
                capacity=capacity,
                totalCount=total,
                paidCount=paid,
                cancelledCount=cancelled,
            )
        )
    return rows


# ---------------------------------------------------------------------------
# Phase 4: per-event enrollments detail.
# ---------------------------------------------------------------------------


@admin_router.get("/enrollments/{event_id}")
async def enrollments_detail(event_id: str) -> EnrollmentsDetailResponse:
    """Return the event header and its full enrollments list.

    Shape is scoped to what the admin detail page renders; the client
    derives the summary-strip counts from the enrollments array.
    """
    page = await event_page_repo.get_page(event_id)
    if page is None:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")

    date_start = getattr(page, "dateStart", None)

    event_header = EnrollmentsDetailEvent(
        id=page.id,
        title=page.title.en or "",
        dateStart=date_start if isinstance(date_start, str) else None,
        status=page.status.value,
        capacity=_get_event_capacity(page),
    )

    return EnrollmentsDetailResponse(
        event=event_header,
        enrollments=list(page.enrollments.values()),
    )


# ---------------------------------------------------------------------------
# Phase 5A: admin mutation endpoints.
# ---------------------------------------------------------------------------


class StatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: EnrollmentStatus


class PaymentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    paymentStatus: PaymentStatus


class ContactUpdateRequest(BaseModel):
    """Partial update — every field is optional.

    Use `model_fields_set` to distinguish "field absent" (leave untouched)
    from "field present with null" (clear the field).
    """

    model_config = ConfigDict(extra="forbid")
    fullName: str | None = None
    email: str | None = None
    phone: str | None = None
    note: str | None = None


class AdminCreateEnrollmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=1)
    email: str | None = None
    phone: str | None = None
    note: str | None = None
    status: EnrollmentStatus | None = None
    paymentStatus: PaymentStatus | None = None

    @model_validator(mode="after")
    def _require_contact(self) -> "AdminCreateEnrollmentRequest":
        if not _has_contact(self.email, self.phone):
            raise ValueError("At least one of email or phone is required")
        return self


class TransferRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    toEventPageId: str = Field(min_length=1)


class TransferResponse(BaseModel):
    sourceEventPageId: str
    sourceEnrollmentId: str
    destinationEventPageId: str
    destinationEnrollmentId: str
    enrollment: Enrollment


# ---------------------------------------------------------------------------
# Status PATCH
# ---------------------------------------------------------------------------


@admin_router.patch("/enrollments/{event_id}/{enrollment_id}/status")
async def patch_enrollment_status(
    event_id: str,
    enrollment_id: str,
    body: StatusUpdateRequest,
) -> Enrollment:
    async with event_page_repo.session() as catalog:
        page = catalog.pages.get(event_id)
        if page is None:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
        enr = page.enrollments.get(enrollment_id)
        if enr is None:
            raise HTTPException(
                status_code=404,
                detail=f"Enrollment not found: {enrollment_id}",
            )

        if not _is_legal_transition(enr.status, body.status):
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Illegal status transition: {enr.status.value} → {body.status.value}"
                ),
            )

        if enr.status != body.status:
            enr.status = body.status
            enr.updatedAt = _iso_now()
            catalog.version += 1

        # Return the enrollment by copying out of the session (the context
        # manager will re-save the catalog on exit).
        return enr.model_copy()


# ---------------------------------------------------------------------------
# Payment PATCH
# ---------------------------------------------------------------------------


@admin_router.patch("/enrollments/{event_id}/{enrollment_id}/payment")
async def patch_enrollment_payment(
    event_id: str,
    enrollment_id: str,
    body: PaymentUpdateRequest,
) -> Enrollment:
    async with event_page_repo.session() as catalog:
        page = catalog.pages.get(event_id)
        if page is None:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
        enr = page.enrollments.get(enrollment_id)
        if enr is None:
            raise HTTPException(
                status_code=404,
                detail=f"Enrollment not found: {enrollment_id}",
            )

        if enr.paymentStatus != body.paymentStatus:
            enr.paymentStatus = body.paymentStatus
            enr.updatedAt = _iso_now()
            catalog.version += 1

        return enr.model_copy()


# ---------------------------------------------------------------------------
# Contact PATCH (partial update)
# ---------------------------------------------------------------------------


@admin_router.patch("/enrollments/{event_id}/{enrollment_id}")
async def patch_enrollment_contact(
    event_id: str,
    enrollment_id: str,
    body: ContactUpdateRequest,
) -> Enrollment:
    fields_set = body.model_fields_set

    async with event_page_repo.session() as catalog:
        page = catalog.pages.get(event_id)
        if page is None:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
        enr = page.enrollments.get(enrollment_id)
        if enr is None:
            raise HTTPException(
                status_code=404,
                detail=f"Enrollment not found: {enrollment_id}",
            )

        changed = False

        if "fullName" in fields_set:
            new_name = (body.fullName or "").strip()
            if not new_name:
                raise HTTPException(
                    status_code=422,
                    detail="fullName must not be empty",
                )
            if new_name != enr.fullName:
                enr.fullName = new_name
                changed = True

        if "email" in fields_set:
            normalized = _normalize_optional_text(body.email)
            if normalized != enr.email:
                enr.email = normalized
                changed = True

        if "phone" in fields_set:
            normalized = _normalize_optional_text(body.phone)
            if normalized != enr.phone:
                enr.phone = normalized
                changed = True

        if "note" in fields_set:
            normalized = _normalize_optional_text(body.note)
            if normalized != enr.note:
                enr.note = normalized
                changed = True

        if not _has_contact(enr.email, enr.phone):
            raise HTTPException(
                status_code=422,
                detail="At least one of email or phone is required",
            )

        if changed:
            enr.updatedAt = _iso_now()
            catalog.version += 1

        return enr.model_copy()


# ---------------------------------------------------------------------------
# Admin manual create
# ---------------------------------------------------------------------------


@admin_router.post(
    "/enrollments/{event_id}",
    response_model=Enrollment,
    status_code=201,
)
async def admin_create_enrollment(
    event_id: str,
    body: AdminCreateEnrollmentRequest,
) -> Enrollment:
    async with event_page_repo.session() as catalog:
        page = catalog.pages.get(event_id)
        if page is None:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")

        capacity = _get_event_capacity(page)
        if capacity is not None and _count_active_enrollments(page) >= capacity:
            raise HTTPException(status_code=409, detail="Event is at capacity")

        now = _iso_now()
        has_price = page.price is not None and page.price.amount > 0
        # Default paymentStatus mirrors the public-enrollment rule so a free
        # event auto-lands as paid.
        default_payment = PaymentStatus.unpaid if has_price else PaymentStatus.paid

        enrollment_id = generate_enrollment_id()
        enrollment = Enrollment(
            id=enrollment_id,
            fullName=body.fullName,
            email=_normalize_optional_text(body.email),
            phone=_normalize_optional_text(body.phone),
            note=_normalize_optional_text(body.note),
            status=body.status or EnrollmentStatus.pending,
            paymentStatus=body.paymentStatus or default_payment,
            createdBy="admin",
            createdAt=now,
            updatedAt=now,
        )

        page.enrollments[enrollment_id] = enrollment
        catalog.version += 1
        return enrollment.model_copy()


# ---------------------------------------------------------------------------
# Transfer (remove from source + create in destination — one session)
# ---------------------------------------------------------------------------


@admin_router.post(
    "/enrollments/{event_id}/{enrollment_id}/transfer",
    response_model=TransferResponse,
    status_code=201,
)
async def transfer_enrollment(
    event_id: str,
    enrollment_id: str,
    body: TransferRequest,
) -> TransferResponse:
    destination_id = body.toEventPageId

    if destination_id == event_id:
        raise HTTPException(
            status_code=400,
            detail="Source and destination must be different events",
        )

    async with event_page_repo.session() as catalog:
        source_page = catalog.pages.get(event_id)
        if source_page is None:
            raise HTTPException(
                status_code=404,
                detail=f"Source event not found: {event_id}",
            )
        dest_page = catalog.pages.get(destination_id)
        if dest_page is None:
            raise HTTPException(
                status_code=404,
                detail=f"Destination event not found: {destination_id}",
            )
        source_enr = source_page.enrollments.get(enrollment_id)
        if source_enr is None:
            raise HTTPException(
                status_code=404,
                detail=f"Enrollment not found: {enrollment_id}",
            )

        if _is_terminal(source_enr.status):
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Enrollment is in a terminal state ({source_enr.status.value}) "
                    "and cannot be transferred"
                ),
            )

        capacity = _get_event_capacity(dest_page)
        if capacity is not None and _count_active_enrollments(dest_page) >= capacity:
            raise HTTPException(
                status_code=409,
                detail="Destination event is at capacity",
            )

        # Validation complete — mutate inside the same session. If any
        # failure happens below, nothing has been persisted yet (the context
        # manager re-saves the whole catalog on exit).
        now = _iso_now()
        new_id = generate_enrollment_id()
        transferred = Enrollment(
            id=new_id,
            fullName=source_enr.fullName,
            email=source_enr.email,
            phone=source_enr.phone,
            note=source_enr.note,
            status=source_enr.status,
            paymentStatus=source_enr.paymentStatus,
            createdBy="admin",
            createdAt=now,
            updatedAt=now,
            stripeSessionId=source_enr.stripeSessionId,
        )

        dest_page.enrollments[new_id] = transferred
        del source_page.enrollments[enrollment_id]
        catalog.version += 1

        return TransferResponse(
            sourceEventPageId=event_id,
            sourceEnrollmentId=enrollment_id,
            destinationEventPageId=destination_id,
            destinationEnrollmentId=new_id,
            enrollment=transferred.model_copy(),
        )
