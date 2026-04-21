# /app/services/stripe_service.py

from __future__ import annotations

import stripe

from app.models.event_pages import EventPageData
from app.settings import settings


def create_checkout_session(event: EventPageData, enrollment_id: str) -> stripe.checkout.Session:
    """Create a Stripe Checkout Session for a paid registration.

    `event` is the canonical EventPage (see
    `decision--event--event-page-is-canonical-event.md`). The metadata key
    `event_id` is preserved verbatim for webhook compatibility; its value is
    now an EventPage id.
    """
    stripe.api_key = settings.stripe_secret_key

    # Localized is a Pydantic BaseModel with an optional `en` field. Prefer the
    # English title; fall back to slug when not set.
    title_en = (event.title.en if event.title and event.title.en else event.slug)
    amount = event.price.amount if event.price else 0
    currency = (event.price.currency if event.price else "eur").lower()

    session = stripe.checkout.Session.create(
        line_items=[
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {"name": title_en},
                    "unit_amount": int(amount * 100),  # Stripe uses cents
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=f"{settings.site_url}/enrollment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.site_url}/enrollment/cancel",
        metadata={"enrollment_id": enrollment_id, "event_id": event.id},
        client_reference_id=enrollment_id,
    )
    return session


def verify_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    stripe.api_key = settings.stripe_secret_key
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )
