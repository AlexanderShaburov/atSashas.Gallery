---
type: open_question
scope: [architecture, data, admin]
status: open
date: 2026-04-22
source_of_truth: true
tags: [future, user, contact, catalog, crm, deferred]
---

# User / contact catalog — deferred architectural concern

## Concern

The SashaGallery admin currently treats each enrolled person as an
`Enrollment` record attached to a single `EventPageData`. There is no
cross-event identity for participants: two enrollments from the same person
across different events are two unrelated records.

For the immediate MVP scope this is correct. It keeps the enrollments
surface simple, honors the "exactly one event entity" invariant
(`invariant--architecture--single-event-entity.md`), and matches the JSON
vault model (`decision--data--json-vault-no-database.md`).

Over time, the lack of cross-event identity will create friction:

- An admin cannot see "all events this person has enrolled in" without a
  manual email/phone search across events.
- Repeat participants re-enter their contact data every time; there is no
  way to reuse a record.
- Transfers (`plan--admin--event-enrollments-management.md` §1) are
  implemented as `remove + create`, losing the trail that "this was the
  same person."
- Admin notes attached to a person accumulate on an event-by-event basis
  rather than on the person.
- Any future export / reporting ("how many of our workshop attendees also
  came to plein air?") has no entity to pivot on.

## Future direction (not to be implemented now)

A plausible forward design is a reusable participant / contact entity
(working name: `Contact` or `Participant`) stored in its own catalog, with
enrollments referencing it by id rather than embedding the contact fields.
This would require:

- A new top-level entity — triggers ADR §3.1 ("adding a new entity
  requires an explicit decision") and an amendment to
  `invariant--architecture--entities-are-finite-and-controlled.md`.
- An identity / merge flow for reconciling records entered with slightly
  different email/phone/name variations.
- A storage model decision: the current JSON vault may not be the right
  substrate for an entity with many-to-many relationships and cross-file
  joins. A database move would itself be an ADR replacing
  `decision--data--json-vault-no-database.md` (or a narrow exception to
  it).
- Migration of existing embedded enrollment contact data into the new
  catalog, and a backward-compatible read path during the transition.

## Explicitly out of scope for the enrollments MVP

`plan--admin--event-enrollments-management.md` must not introduce any of
the following, even as preparatory abstractions:

- A separate contact or participant entity.
- A contact picker in the admin enrollment-create modal.
- Identity-merge logic, deduplication across events, or fuzzy matching.
- CRM behavior (tags, segments, history views on a contact).
- A database substrate for enrollments or contacts.

The correct posture for the MVP plan is: enrollments are embedded records
on the event; contact fields live on the enrollment; transfer creates a
new enrollment without preserving identity; the Stripe path (where
present) remains the only external reference.

## Triggers that would reopen this

Treat any of the following as signals to start the ADR process, not to
quietly evolve the enrollments code:

- Admin explicitly asks to see a person's history across events.
- A mailing / outreach feature is requested that needs a contact list.
- JSON vault hits the tripwires in
  `plan--events--cta-registration-system.md` §6.4 and a migration is
  already on the table — bundle the entity redesign with the storage
  redesign if the timing lines up.
- Product requirement for self-service (participant login, own
  registration history) emerges.

Until one of those triggers fires, the MVP enrollments model stands as-is.

## Related

- `plan--admin--event-enrollments-management.md` — the MVP that defers
  this concern
- `invariant--architecture--entities-are-finite-and-controlled.md` —
  the rule any future contact entity must clear
- `invariant--architecture--single-event-entity.md` — preserved by this
  deferral; enrollments remain sub-records of events
- `decision--data--json-vault-no-database.md` — the storage substrate
  that may need revisiting
- `plan--events--cta-registration-system.md` §6.4 — the scale tripwires
  that may co-trigger a storage change
