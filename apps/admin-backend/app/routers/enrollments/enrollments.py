# /app/routers/enrollments/enrollments.py

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.events import Enrollment, EnrollRequest, PaymentStatus
from app.repos.event_repo import event_repo, generate_enrollment_id
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
    async with event_repo.session() as catalog:
        event = catalog.events.get(event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")

        if event.status != "scheduled":
            raise HTTPException(
                status_code=400,
                detail=f"Enrollment not open (event status: {event.status})",
            )

        enrollment_id = generate_enrollment_id()
        now = datetime.now(timezone.utc).isoformat()

        has_price = event.price is not None and event.price.amount > 0

        enrollment = Enrollment(
            id=enrollment_id,
            fullName=body.fullName,
            email=body.email,
            createdAt=now,
            paymentStatus=PaymentStatus.pending if has_price else PaymentStatus.paid,
        )

        event.enrollments[enrollment_id] = enrollment
        catalog.version += 1

    if has_price:
        try:
            session = create_checkout_session(event, enrollment_id)
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
        event_id = session_data.get("metadata", {}).get("event_id")
        stripe_session_id = session_data.get("id")

        if enrollment_id and event_id:
            try:
                async with event_repo.session() as catalog:
                    ev = catalog.events.get(event_id)
                    if ev and enrollment_id in ev.enrollments:
                        ev.enrollments[enrollment_id].paymentStatus = PaymentStatus.paid
                        ev.enrollments[enrollment_id].stripeSessionId = stripe_session_id
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
    event = await event_repo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
    return list(event.enrollments.values())
