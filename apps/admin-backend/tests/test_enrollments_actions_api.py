"""Admin enrollment mutation endpoints — Phase 5A.

Covers:
  - PATCH /admin/enrollments/{event_id}/{enrollment_id}/status
  - PATCH /admin/enrollments/{event_id}/{enrollment_id}/payment
  - PATCH /admin/enrollments/{event_id}/{enrollment_id}  (contact)
  - POST  /admin/enrollments/{event_id}                  (admin create)
  - POST  /admin/enrollments/{event_id}/{enrollment_id}/transfer

See knowledge/plans/plan--admin--event-enrollments-management.md §Phase 5.
"""

from __future__ import annotations


def _create_public_enrollment(client, event_id: str, name: str, email: str) -> str:
    """Helper: seed a pending / paid (free event) enrollment via the public endpoint."""
    resp = client.post(
        f"/public/events/{event_id}/enroll",
        json={"fullName": name, "email": email},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["enrollmentId"]


def _find_enrollment(client, event_id: str, enrollment_id: str) -> dict:
    detail = client.get(f"/admin/enrollments/{event_id}").json()
    for e in detail["enrollments"]:
        if e["id"] == enrollment_id:
            return e
    raise AssertionError(
        f"enrollment {enrollment_id} not present in event {event_id}"
    )


# ---------------------------------------------------------------------------
# Status PATCH
# ---------------------------------------------------------------------------


def test_status_pending_to_confirmed_is_legal(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5status",
        "Status A",
        "status-a@example.com",
    )
    before = _find_enrollment(client, "event-20260421-p5status", eid)
    assert before["status"] == "pending"

    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5status/{eid}/status",
        json={"status": "confirmed"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "confirmed"
    # updatedAt bumped past createdAt.
    assert body["updatedAt"] >= body["createdAt"]
    assert body["updatedAt"] != before["updatedAt"]


def test_status_pending_to_attended_is_illegal(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5status",
        "Status B",
        "status-b@example.com",
    )
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5status/{eid}/status",
        json={"status": "attended"},
    )
    assert resp.status_code == 409
    assert "illegal status transition" in resp.json()["detail"].lower()


def test_status_from_terminal_is_rejected(client):
    """Cancelled (terminal) cannot transition anywhere."""
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5status",
        "Status C",
        "status-c@example.com",
    )
    # Move to terminal state.
    cancel = client.patch(
        f"/admin/enrollments/event-20260421-p5status/{eid}/status",
        json={"status": "cancelled_by_admin"},
    )
    assert cancel.status_code == 200
    # Any further transition must fail.
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5status/{eid}/status",
        json={"status": "confirmed"},
    )
    assert resp.status_code == 409


def test_status_same_state_is_idempotent(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5status",
        "Status D",
        "status-d@example.com",
    )
    before = _find_enrollment(client, "event-20260421-p5status", eid)
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5status/{eid}/status",
        json={"status": "pending"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "pending"
    # No change → updatedAt preserved.
    assert body["updatedAt"] == before["updatedAt"]


def test_status_on_unknown_event_is_404(client):
    resp = client.patch(
        "/admin/enrollments/event-does-not-exist/enr-xxx/status",
        json={"status": "confirmed"},
    )
    assert resp.status_code == 404


def test_status_on_unknown_enrollment_is_404(client):
    resp = client.patch(
        "/admin/enrollments/event-20260421-p5status/enr-unknown/status",
        json={"status": "confirmed"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Payment PATCH
# ---------------------------------------------------------------------------


def test_payment_paid_to_unpaid_and_back(client):
    """Free-event enrollments start paid; toggle to unpaid and back."""
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5pay",
        "Pay A",
        "pay-a@example.com",
    )
    before = _find_enrollment(client, "event-20260421-p5pay", eid)
    assert before["paymentStatus"] == "paid"

    to_unpaid = client.patch(
        f"/admin/enrollments/event-20260421-p5pay/{eid}/payment",
        json={"paymentStatus": "unpaid"},
    )
    assert to_unpaid.status_code == 200
    assert to_unpaid.json()["paymentStatus"] == "unpaid"
    assert to_unpaid.json()["updatedAt"] != before["updatedAt"]

    back_to_paid = client.patch(
        f"/admin/enrollments/event-20260421-p5pay/{eid}/payment",
        json={"paymentStatus": "paid"},
    )
    assert back_to_paid.status_code == 200
    assert back_to_paid.json()["paymentStatus"] == "paid"


def test_payment_same_state_is_idempotent(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5pay",
        "Pay B",
        "pay-b@example.com",
    )
    before = _find_enrollment(client, "event-20260421-p5pay", eid)
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5pay/{eid}/payment",
        json={"paymentStatus": "paid"},
    )
    assert resp.status_code == 200
    assert resp.json()["updatedAt"] == before["updatedAt"]


# ---------------------------------------------------------------------------
# Contact PATCH
# ---------------------------------------------------------------------------


def test_contact_partial_update_name_only(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5contact",
        "Contact A",
        "contact-a@example.com",
    )
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"fullName": "Contact A Renamed"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["fullName"] == "Contact A Renamed"
    # Other fields untouched.
    assert body["email"] == "contact-a@example.com"


def test_contact_can_clear_email_when_phone_present(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5contact",
        "Contact B",
        "contact-b@example.com",
    )
    # First add a phone so we can then clear email.
    add_phone = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"phone": "+1-555-0500"},
    )
    assert add_phone.status_code == 200
    assert add_phone.json()["phone"] == "+1-555-0500"

    clear_email = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"email": None},
    )
    assert clear_email.status_code == 200
    body = clear_email.json()
    assert body["email"] is None
    assert body["phone"] == "+1-555-0500"


def test_contact_rejects_clearing_both_channels(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5contact",
        "Contact C",
        "contact-c@example.com",
    )
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"email": None, "phone": None},
    )
    assert resp.status_code == 422


def test_contact_rejects_whitespace_only_contact(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5contact",
        "Contact D",
        "contact-d@example.com",
    )
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"email": "   ", "phone": ""},
    )
    assert resp.status_code == 422


def test_contact_empty_name_rejected(client):
    eid = _create_public_enrollment(
        client,
        "event-20260421-p5contact",
        "Contact E",
        "contact-e@example.com",
    )
    resp = client.patch(
        f"/admin/enrollments/event-20260421-p5contact/{eid}",
        json={"fullName": "   "},
    )
    assert resp.status_code == 422


def test_contact_event_not_found(client):
    resp = client.patch(
        "/admin/enrollments/event-does-not-exist/enr-x",
        json={"fullName": "X"},
    )
    assert resp.status_code == 404


def test_contact_enrollment_not_found(client):
    resp = client.patch(
        "/admin/enrollments/event-20260421-p5contact/enr-unknown",
        json={"fullName": "X"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Admin manual create
# ---------------------------------------------------------------------------


def test_admin_create_with_email_succeeds(client):
    resp = client.post(
        "/admin/enrollments/event-20260421-p5create",
        json={"fullName": "Admin A", "email": "admin-a@example.com"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["fullName"] == "Admin A"
    assert body["email"] == "admin-a@example.com"
    assert body["phone"] is None
    assert body["createdBy"] == "admin"
    assert body["status"] == "pending"
    # Free event → default paymentStatus = paid.
    assert body["paymentStatus"] == "paid"
    assert body["createdAt"] == body["updatedAt"]


def test_admin_create_phone_only_succeeds(client):
    resp = client.post(
        "/admin/enrollments/event-20260421-p5create",
        json={"fullName": "Admin B", "phone": "+1-555-0600"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] is None
    assert body["phone"] == "+1-555-0600"
    assert body["createdBy"] == "admin"


def test_admin_create_rejects_without_contact(client):
    resp = client.post(
        "/admin/enrollments/event-20260421-p5create",
        json={"fullName": "Admin C"},
    )
    assert resp.status_code == 422


def test_admin_create_honors_explicit_status_and_payment(client):
    resp = client.post(
        "/admin/enrollments/event-20260421-p5create",
        json={
            "fullName": "Admin D",
            "email": "admin-d@example.com",
            "status": "confirmed",
            "paymentStatus": "unpaid",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "confirmed"
    assert body["paymentStatus"] == "unpaid"


def test_admin_create_rejects_when_at_capacity(client):
    """Capacity=1: one create fills it, second is rejected."""
    first = client.post(
        "/admin/enrollments/event-20260421-p5createfull",
        json={"fullName": "Seat Filler", "email": "fill@example.com"},
    )
    assert first.status_code == 201, first.text

    second = client.post(
        "/admin/enrollments/event-20260421-p5createfull",
        json={"fullName": "Late Admin", "email": "late-admin@example.com"},
    )
    assert second.status_code == 409
    assert "capacity" in second.json()["detail"].lower()


def test_admin_create_on_unknown_event_is_404(client):
    resp = client.post(
        "/admin/enrollments/event-does-not-exist",
        json={"fullName": "Nope", "email": "nope@example.com"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Transfer
# ---------------------------------------------------------------------------


def test_transfer_moves_enrollment_and_preserves_data(client):
    src_eid = _create_public_enrollment(
        client,
        "event-20260421-p5trsrc",
        "Traveler A",
        "traveler-a@example.com",
    )

    resp = client.post(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/transfer",
        json={"toEventPageId": "event-20260421-p5trdst"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["sourceEventPageId"] == "event-20260421-p5trsrc"
    assert body["sourceEnrollmentId"] == src_eid
    assert body["destinationEventPageId"] == "event-20260421-p5trdst"
    new_id = body["destinationEnrollmentId"]
    assert new_id != src_eid

    # Participant data preserved.
    assert body["enrollment"]["fullName"] == "Traveler A"
    assert body["enrollment"]["email"] == "traveler-a@example.com"
    assert body["enrollment"]["createdBy"] == "admin"

    # Source no longer has the original.
    src_detail = client.get("/admin/enrollments/event-20260421-p5trsrc").json()
    assert all(e["id"] != src_eid for e in src_detail["enrollments"])

    # Destination has the new one.
    dst_detail = client.get("/admin/enrollments/event-20260421-p5trdst").json()
    assert any(e["id"] == new_id for e in dst_detail["enrollments"])


def test_transfer_rejects_same_source_and_destination(client):
    src_eid = _create_public_enrollment(
        client,
        "event-20260421-p5trsrc",
        "Traveler B",
        "traveler-b@example.com",
    )
    resp = client.post(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/transfer",
        json={"toEventPageId": "event-20260421-p5trsrc"},
    )
    assert resp.status_code == 400
    # Source preserved.
    _find_enrollment(client, "event-20260421-p5trsrc", src_eid)


def test_transfer_rejects_when_destination_is_full(client):
    # Pre-fill the capacity=1 destination.
    fill = client.post(
        "/admin/enrollments/event-20260421-p5trfull",
        json={"fullName": "Destination Filler", "email": "dst-fill@example.com"},
    )
    assert fill.status_code == 201

    src_eid = _create_public_enrollment(
        client,
        "event-20260421-p5trsrc",
        "Traveler C",
        "traveler-c@example.com",
    )
    resp = client.post(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/transfer",
        json={"toEventPageId": "event-20260421-p5trfull"},
    )
    assert resp.status_code == 409
    assert "capacity" in resp.json()["detail"].lower()

    # Source preserved on failure.
    _find_enrollment(client, "event-20260421-p5trsrc", src_eid)


def test_transfer_rejects_terminal_source(client):
    src_eid = _create_public_enrollment(
        client,
        "event-20260421-p5trsrc",
        "Traveler D",
        "traveler-d@example.com",
    )
    cancel = client.patch(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/status",
        json={"status": "cancelled_by_admin"},
    )
    assert cancel.status_code == 200

    resp = client.post(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/transfer",
        json={"toEventPageId": "event-20260421-p5trdst"},
    )
    assert resp.status_code == 409
    assert "terminal" in resp.json()["detail"].lower()
    # Source preserved (still in the cancelled state on the source event).
    preserved = _find_enrollment(client, "event-20260421-p5trsrc", src_eid)
    assert preserved["status"] == "cancelled_by_admin"


def test_transfer_source_event_not_found(client):
    resp = client.post(
        "/admin/enrollments/event-does-not-exist/enr-x/transfer",
        json={"toEventPageId": "event-20260421-p5trdst"},
    )
    assert resp.status_code == 404


def test_transfer_destination_event_not_found(client):
    src_eid = _create_public_enrollment(
        client,
        "event-20260421-p5trsrc",
        "Traveler E",
        "traveler-e@example.com",
    )
    resp = client.post(
        f"/admin/enrollments/event-20260421-p5trsrc/{src_eid}/transfer",
        json={"toEventPageId": "event-does-not-exist"},
    )
    assert resp.status_code == 404
    # Source preserved.
    _find_enrollment(client, "event-20260421-p5trsrc", src_eid)


def test_transfer_source_enrollment_not_found(client):
    resp = client.post(
        "/admin/enrollments/event-20260421-p5trsrc/enr-missing/transfer",
        json={"toEventPageId": "event-20260421-p5trdst"},
    )
    assert resp.status_code == 404
