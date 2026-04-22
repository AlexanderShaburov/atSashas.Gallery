"""Enrollment API — canonicalization Phase 2 + enrollments Phase 2.

Covers:
  - EventPage canonicalization migration (Phase 2 of
    knowledge/plans/plan--event--collapse-into-event-page.md): public
    enrollment resolves against the EventPage catalog.
  - Admin Enrollments plan Phase 2 (knowledge/plans/plan--admin--event-
    enrollments-management.md): public flow accepts optional phone/note,
    enforces "email OR phone" contact, and enforces capacity with a 409.
"""


def test_enroll_free_event_against_event_page(client):
    """Registering against a scheduled EventPage persists an enrollment on it."""
    resp = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={"fullName": "Alice Tester", "email": "alice@example.com"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "free"
    assert body["enrollmentId"].startswith("enroll-")
    assert body.get("checkoutUrl") is None

    # Admin list should now see the enrollment on the EventPage, not EventData.
    list_resp = client.get("/admin/events/event-20260421-test01/enrollments")
    assert list_resp.status_code == 200
    enrollments = list_resp.json()
    assert len(enrollments) == 1
    assert enrollments[0]["fullName"] == "Alice Tester"
    assert enrollments[0]["email"] == "alice@example.com"
    # Phase 2 creation defaults must be populated.
    assert enrollments[0]["status"] == "pending"
    assert enrollments[0]["paymentStatus"] == "paid"  # free event → paid immediately
    assert enrollments[0]["createdBy"] == "public"
    assert enrollments[0]["updatedAt"]  # non-empty
    # Optional contact/note fields default to null when not provided.
    assert enrollments[0].get("phone") is None
    assert enrollments[0].get("note") is None


def test_enroll_rejects_unknown_event_page_id(client):
    """Unknown id → 404; proves the lookup is against event_pages repo."""
    resp = client.post(
        "/public/events/event-unknown-xxxxxx/enroll",
        json={"fullName": "Nobody", "email": "nobody@example.com"},
    )
    assert resp.status_code == 404
    assert "Event not found" in resp.json()["detail"]


def test_enroll_rejects_draft_event_page(client):
    """Draft EventPage cannot be enrolled into; status gate enforced."""
    resp = client.post(
        "/public/events/event-20260421-test02/enroll",
        json={"fullName": "Eager Tester", "email": "eager@example.com"},
    )
    assert resp.status_code == 400
    assert "status: draft" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Phase 2: email-or-phone input validation
# ---------------------------------------------------------------------------


def test_enroll_phone_only_accepted(client):
    """Phone-only enrollment is valid when email is absent."""
    resp = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={"fullName": "Phone Only", "phone": "+1-555-0100"},
    )
    assert resp.status_code == 201, resp.text

    list_resp = client.get("/admin/events/event-20260421-test01/enrollments")
    created = [
        e for e in list_resp.json() if e["fullName"] == "Phone Only"
    ]
    assert len(created) == 1
    assert created[0]["phone"] == "+1-555-0100"
    assert created[0].get("email") is None


def test_enroll_both_email_and_phone_accepted(client):
    """Supplying both channels is valid and both are persisted."""
    resp = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={
            "fullName": "Both Channels",
            "email": "both@example.com",
            "phone": "+1-555-0200",
            "note": "Coming with a friend",
        },
    )
    assert resp.status_code == 201, resp.text

    list_resp = client.get("/admin/events/event-20260421-test01/enrollments")
    created = [
        e for e in list_resp.json() if e["fullName"] == "Both Channels"
    ]
    assert len(created) == 1
    assert created[0]["email"] == "both@example.com"
    assert created[0]["phone"] == "+1-555-0200"
    assert created[0]["note"] == "Coming with a friend"


def test_enroll_rejects_when_neither_email_nor_phone(client):
    """Missing both contact channels → 422 (Pydantic validation failure)."""
    resp = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={"fullName": "No Contact"},
    )
    assert resp.status_code == 422
    # FastAPI 422 body has a `detail` list; the message surfaces our validator.
    assert "email or phone" in resp.text.lower()


def test_enroll_rejects_when_both_contacts_are_blank(client):
    """Empty strings for both email and phone are not valid contacts."""
    resp = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={"fullName": "Blank Contact", "email": "   ", "phone": ""},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Phase 2: capacity enforcement
# ---------------------------------------------------------------------------


def test_enroll_rejects_when_at_capacity(client):
    """A single-seat event accepts one enrollment, then rejects with 409."""
    # First enrollment fills the single seat.
    first = client.post(
        "/public/events/event-20260421-cap001/enroll",
        json={"fullName": "Seat Taker", "email": "seat@example.com"},
    )
    assert first.status_code == 201, first.text

    # Second enrollment is rejected.
    second = client.post(
        "/public/events/event-20260421-cap001/enroll",
        json={"fullName": "Late Arriver", "email": "late@example.com"},
    )
    assert second.status_code == 409
    assert "capacity" in second.json()["detail"].lower()


def test_enroll_below_capacity_still_accepts(client):
    """An event with capacity > current enrollments accepts new ones."""
    # First enrollment: 1/2.
    first = client.post(
        "/public/events/event-20260421-cap002/enroll",
        json={"fullName": "First Seat", "email": "first@example.com"},
    )
    assert first.status_code == 201, first.text

    # Second enrollment: 2/2 — last seat, still accepted.
    second = client.post(
        "/public/events/event-20260421-cap002/enroll",
        json={"fullName": "Second Seat", "phone": "+1-555-0300"},
    )
    assert second.status_code == 201, second.text

    # Third enrollment: 3 > 2 — rejected.
    third = client.post(
        "/public/events/event-20260421-cap002/enroll",
        json={"fullName": "Third Try", "email": "third@example.com"},
    )
    assert third.status_code == 409


def test_enroll_capacity_ignores_events_without_register_cta(client):
    """Events whose CTA does not declare a register-kind capacity are unbounded."""
    # test01 has no ctaAction; enrolling many should all succeed.
    for i in range(3):
        resp = client.post(
            "/public/events/event-20260421-test01/enroll",
            json={
                "fullName": f"Unbounded Tester {i}",
                "email": f"unbound{i}@example.com",
            },
        )
        assert resp.status_code == 201, resp.text
