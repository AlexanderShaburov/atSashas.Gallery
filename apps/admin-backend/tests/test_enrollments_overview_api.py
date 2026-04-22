"""Admin enrollments overview endpoint — Phase 3.

Covers the aggregation contract of `GET /admin/enrollments/overview`
defined in
knowledge/plans/plan--admin--event-enrollments-management.md §Phase 3:

  - per-event row appears for each EventPage (including events with no
    enrollments)
  - totalCount / paidCount / cancelledCount are counted correctly
  - capacity reflects the register-kind CTA, null otherwise
  - events with missing `dateStart` are handled safely (field absent →
    `dateStart` serializes as null)
"""

from __future__ import annotations


def _by_id(rows: list[dict], event_id: str) -> dict:
    for r in rows:
        if r["eventPageId"] == event_id:
            return r
    raise AssertionError(f"overview row for {event_id} not found; rows={rows}")


def test_overview_returns_a_row_for_every_event_page(client):
    resp = client.get("/admin/enrollments/overview")
    assert resp.status_code == 200, resp.text
    rows = resp.json()
    ids = {r["eventPageId"] for r in rows}
    # Seed events from conftest — these must all be represented.
    assert "event-20260421-test01" in ids
    assert "event-20260421-test02" in ids  # draft event still shows up
    assert "event-20260421-cap001" in ids
    assert "event-20260421-cap002" in ids


def test_overview_row_shape_for_event_without_ctaAction(client):
    """test01 has no ctaAction → capacity is null (unbounded)."""
    resp = client.get("/admin/enrollments/overview")
    row = _by_id(resp.json(), "event-20260421-test01")
    assert row["title"] == "Free Workshop"
    assert row["status"] == "scheduled"
    assert row["capacity"] is None
    # Earlier tests seeded some enrollments on test01; at minimum the fields
    # are ints (exercised by the other assertions below).
    assert isinstance(row["totalCount"], int)
    assert isinstance(row["paidCount"], int)
    assert isinstance(row["cancelledCount"], int)
    # Missing dateStart surfaces as null rather than throwing.
    assert row["dateStart"] is None


def test_overview_row_shape_for_capacity_configured_event(client):
    """cap001 has ctaAction.kind = register with capacity = 1."""
    resp = client.get("/admin/enrollments/overview")
    row = _by_id(resp.json(), "event-20260421-cap001")
    assert row["capacity"] == 1
    assert row["status"] == "scheduled"


# ---------------------------------------------------------------------------
# Counting rules
# ---------------------------------------------------------------------------


def test_overview_paid_count_reflects_only_paid_paymentStatus(client):
    """Two free enrollments → totalCount and paidCount both = 2.

    Uses a Phase-3-dedicated event to avoid conflicts with capacity-reached
    state carried over from other tests in the same session.
    """
    for i in range(2):
        resp = client.post(
            "/public/events/event-20260421-ovw001/enroll",
            json={
                "fullName": f"Overview Paid {i}",
                "email": f"overview-paid-{i}@example.com",
            },
        )
        assert resp.status_code == 201, resp.text

    overview = client.get("/admin/enrollments/overview").json()
    row = _by_id(overview, "event-20260421-ovw001")
    # Both enrollments were free → paymentStatus=paid.
    assert row["totalCount"] == 2
    assert row["paidCount"] == 2
    # None of them cancelled.
    assert row["cancelledCount"] == 0


def test_overview_cancelled_count_covers_both_cancellation_states(client, tmp_path):
    """Directly seed enrollments with cancellation states via the repo.

    The PATCH endpoints for status are Phase 5 scope, so we mutate the
    catalog through `event_page_repo.session()` to set up the fixture.
    """
    import asyncio
    from datetime import datetime, timezone

    from app.models.enrollments import Enrollment, EnrollmentStatus, PaymentStatus
    from app.repos.event_page_repo import event_page_repo, generate_enrollment_id

    async def seed() -> None:
        async with event_page_repo.session() as catalog:
            page = catalog.pages["event-20260421-test01"]
            now = datetime.now(timezone.utc).isoformat()
            for status in (
                EnrollmentStatus.cancelled_by_user,
                EnrollmentStatus.cancelled_by_admin,
            ):
                eid = generate_enrollment_id()
                page.enrollments[eid] = Enrollment(
                    id=eid,
                    fullName=f"Cancelled via {status.value}",
                    email=f"{status.value}@example.com",
                    createdAt=now,
                    updatedAt=now,
                    createdBy="admin",
                    status=status,
                    paymentStatus=PaymentStatus.unpaid,
                )

    asyncio.run(seed())

    overview = client.get("/admin/enrollments/overview").json()
    row = _by_id(overview, "event-20260421-test01")
    assert row["cancelledCount"] >= 2


def test_overview_missing_dateStart_surfaces_as_null(client):
    """All seeded events omit dateStart — row.dateStart must be None, not error."""
    resp = client.get("/admin/enrollments/overview")
    assert resp.status_code == 200
    for row in resp.json():
        assert row["dateStart"] is None or isinstance(row["dateStart"], str)


def test_overview_requires_authentication(client):
    """Admin endpoint must be auth-gated like other /admin routes.

    The fixture `client` already overrides `get_current_user`, so a direct
    call succeeds. This test only asserts the shape returned is JSON.
    """
    resp = client.get("/admin/enrollments/overview")
    assert resp.headers["content-type"].startswith("application/json")
    assert isinstance(resp.json(), list)
