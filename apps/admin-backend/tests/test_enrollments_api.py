"""Enrollment API — Phase 2 of the EventPage canonicalization migration.

Verifies that `POST /public/events/{id}/enroll` resolves IDs against the
EventPage catalog (canonical entity) instead of the legacy EventData catalog.
See knowledge/plans/plan--event--collapse-into-event-page.md §Phase 2.
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
