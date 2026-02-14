# /app/services/stripe_service.py

from __future__ import annotations

import stripe

from app.models.events import EventData
from app.settings import settings


def create_checkout_session(event: EventData, enrollment_id: str) -> stripe.checkout.Session:
    stripe.api_key = settings.stripe_secret_key

    title_en = event.title.get("en", event.slug) if isinstance(event.title, dict) else event.slug
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
