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
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.enrollments import Enrollment, EnrollRequest, PaymentStatus
from app.repos.event_page_repo import event_page_repo, generate_enrollment_id
from app.services.stripe_service import create_checkout_session, verify_webhook_event

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

        enrollment_id = generate_enrollment_id()
        now = datetime.now(timezone.utc).isoformat()

        has_price = page.price is not None and page.price.amount > 0

        enrollment = Enrollment(
            id=enrollment_id,
            fullName=body.fullName,
            email=body.email,
            createdAt=now,
            paymentStatus=PaymentStatus.pending if has_price else PaymentStatus.paid,
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
