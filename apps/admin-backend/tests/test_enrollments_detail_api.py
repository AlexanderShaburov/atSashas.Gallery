"""Admin enrollments detail endpoint — Phase 4.

Covers `GET /admin/enrollments/{event_id}` defined in
knowledge/plans/plan--admin--event-enrollments-management.md §Phase 4:

  - returns { event: {...}, enrollments: [...] } for a valid event
  - event header includes id / title / dateStart (nullable) / status /
    capacity (nullable for unbounded events)
  - enrollments preserve the new Phase 1 shape (status, paymentStatus,
    createdBy, updatedAt) and optional contact/note fields
  - unknown event id → 404
  - capacity comes from the register-kind CTA only
"""


def test_detail_returns_event_and_enrollments_shape(client):
    """Unbounded event: capacity null; enrollments may be populated by earlier tests."""
    resp = client.get("/admin/enrollments/event-20260421-test01")
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert "event" in body
    assert "enrollments" in body

    event = body["event"]
    assert event["id"] == "event-20260421-test01"
    assert event["title"] == "Free Workshop"
    assert event["status"] == "scheduled"
    assert event["capacity"] is None  # no ctaAction → unbounded
    assert event["dateStart"] is None  # seed omits dateStart

    enrollments = body["enrollments"]
    assert isinstance(enrollments, list)
    # Each record must carry the Phase 1 fields.
    for e in enrollments:
        assert "id" in e
        assert "fullName" in e
        assert "status" in e
        assert "paymentStatus" in e
        assert "createdBy" in e
        assert "createdAt" in e
        assert "updatedAt" in e


def test_detail_returns_capacity_for_register_cta_events(client):
    resp = client.get("/admin/enrollments/event-20260421-cap001")
    assert resp.status_code == 200
    event = resp.json()["event"]
    assert event["capacity"] == 1


def test_detail_returns_404_for_unknown_event(client):
    resp = client.get("/admin/enrollments/event-does-not-exist")
    assert resp.status_code == 404
    assert "Event not found" in resp.json()["detail"]


def test_detail_does_not_shadow_overview_route(client):
    """Route order: /enrollments/overview must still resolve to the list."""
    overview = client.get("/admin/enrollments/overview")
    assert overview.status_code == 200
    assert isinstance(overview.json(), list)


def test_detail_enrollment_contains_optional_contact_fields_when_provided(client):
    """Create an enrollment with phone + note, then verify detail returns them."""
    create = client.post(
        "/public/events/event-20260421-test01/enroll",
        json={
            "fullName": "Detail Check",
            "phone": "+1-555-0999",
            "note": "Detail test note",
        },
    )
    assert create.status_code == 201, create.text

    body = client.get("/admin/enrollments/event-20260421-test01").json()
    matching = [e for e in body["enrollments"] if e["fullName"] == "Detail Check"]
    assert len(matching) == 1
    e = matching[0]
    assert e["phone"] == "+1-555-0999"
    assert e["note"] == "Detail test note"
    # Email absent on a phone-only enrollment — must serialize as null.
    assert e["email"] is None
    assert e["status"] == "pending"
    assert e["createdBy"] == "public"
    # Free event → paymentStatus is paid.
    assert e["paymentStatus"] == "paid"
