---
type: bug
scope: [event, data, architecture]
status: fixed
date: 2026-04-22
source_of_truth: true
tags: [id, event, event-page, ux, architecture, half-migration]
---

# Half-migrated Event ↔ EventPage architecture with colliding IDs

## Symptom

User configures a Registration CTA on an Event Page, pastes a plausible-looking ID into the "Linked Event ID" field, saves. On submitting the enrollment form, the backend returns `404 {"detail":"Event not found: event-YYYYMMDD-xxxxxx"}` even though the ID belongs to a record that clearly exists in the current admin UI.

## Root cause (corrected 2026-04-21)

The system is in a half-migrated state:

**The admin UI treats EventPage as the canonical event entity.**
- `pages/admin/AdminIndexPage.tsx:37` — dashboard "Events" tile → `/admin/event-pages`
- `features/admin/shared/ui/adminHeader/AdminHeader.tsx:66` — admin header nav → `/admin/event-pages`
- Zero UI links point at `/admin/events`. The EventEditor is only reachable by typing the URL.

**The enrollment subsystem still treats EventData as canonical.**
- `apps/admin-backend/app/routers/enrollments/enrollments.py:42` — `async with event_repo.session() as catalog: event = catalog.events.get(event_id)` — reads `vault/json/events/catalog.json` exclusively.
- No awareness of `event_pages/catalog.json`.

**Both entities use the same ID prefix.**
- Backend `generate_event_id()` returns `event-YYYYMMDD-{base32(6)}`.
- Frontend `createEventPage(preset)` calls `generateId('event')` → identical format.
- Same shape, two disjoint catalogs, no way to tell them apart by eye.

**Consequence.** The "Linked Event ID" field on EventPage suggests a cross-catalog reference, but:
- The admin UI exposes no flow to create the EventData that the field expects.
- The ID shape gives no hint that two catalogs exist.
- Users reasonably paste the EventPage's own `id` (seeing a plausible `event-...` value and having no alternative) — producing self-referential records that the enrollment endpoint cannot resolve.

The earlier framing of this bug as "ID prefix collision + missing editor validation" was too narrow. The real defect is the half-completed migration — the UI moved to EventPage, enrollment didn't. Adding editor-side validation would paper over the symptom without resolving the architectural split.

## Evidence

- `apps/frontend/src/entities/event/eventFactory.ts:85` — `const id = generateId('event')` for Event Pages.
- `apps/admin-backend/app/repos/event_repo.py:16` — `generate_event_id()` for Events with identical format.
- Observed state 2026-04-21: `event_pages/catalog.json` contains `event-20260421-ax8x2r` whose `eventId` field equals its own `id`.

## Spec deviation

`architecture--data--domain-model.md` assigns the `event-` prefix only to the **Event** entity. Event Pages are not listed as a Constitution-level domain entity — yet `createEventPage` adopted the same ID format. This diverges from the domain-model contract.

## Resolution

Ratified in `decision--event--event-page-is-canonical-event.md` on 2026-04-21: EventPage is the canonical entity; legacy `EventData` retired. Execution completed through `plan--event--collapse-into-event-page.md` Phases 0–5 (2026-04-21) and manual-QA verified end-to-end on 2026-04-22.

- Phase 2 repointed enrollment to `event_page_repo`; automated test `tests/test_enrollments_api.py` proves the canonical lookup.
- Phase 3 dropped the `eventId` gate from the register CTA and switched `EnrollmentForm` to `page.id`.
- Phase 4 deleted `vault/json/events/catalog.json` with a clean reference audit.
- Phase 5 retired all legacy code (router, repo, model, provider, block-preview event renderers, block-level event plumbing) and added ESLint guardrails against reintroduction (`invariant--architecture--single-event-entity.md`).

Symptom path confirmed gone: a newly authored Event Page is addressed by `page.id`, enrollment submits to `POST /api/public/events/{page.id}/enroll`, backend resolves against `event_pages/catalog.json`, and the registration persists on `EventPageData.enrollments`. The "Event not found" 404 reported in the original symptom is structurally impossible now.

ID prefix `event-YYYYMMDD-…` remains, but is uncontested: there is no second entity sharing the shape.

## Related

- `plan--events--cta-registration-system.md` (Phase 2 Event picker)
- `architecture--data--domain-model.md`
- `invariant--architecture--entities-are-finite-and-controlled.md`
- `spec--editor--event-system-behavior.md`
