---
type: invariant
scope: [architecture, data, event]
status: active
date: 2026-04-21
source_of_truth: true
tags: [constitution, domain-model, event]
---

# The system has exactly one event entity

## Rule

The SashaGallery codebase holds **exactly one** domain entity representing an "event": `EventPage` (in-code: `EventPageData`). There is no parallel or secondary event model, no dual editor, no separate enrollment catalog, no legacy carryover.

Concretely:

- All event records live in `vault/json/event_pages/catalog.json`.
- All event authoring happens in `EventPageEditor` (`/admin/event-pages`).
- All enrollments are stored on `EventPageData.enrollments`.
- All public visibility flows from `EventPageData.status`.
- All HomeDoc references point at `EventPage.id`.

No other directory, file, editor, route, or storage location is allowed to represent the concept of an event. If a new use case appears to need a parallel representation, it requires a new ADR replacing or amending `decision--event--event-page-is-canonical-event.md`.

## Why

From 2026-02 through 2026-04-21 the system held two parallel event models (`EventData` + `EventPageData`) from a half-completed migration. The split caused:

- Enrollment 404s because the admin UI wrote to one catalog and the backend read from the other (see `bug--event--id-prefix-collision-between-event-and-eventpage.md`).
- Architecture drift where the knowledge base, the Constitution, and the code disagreed about what an event was.
- An ID collision class that no amount of validation could fully resolve without retiring one side.

The migration plan (`plan--event--collapse-into-event-page.md`) closes that split. This invariant is the enforcement hook preventing its re-introduction.

## Consequence of violation

- Re-introduces the drift class that produced the 2026-04 enrollment bug.
- Breaks "single source of truth" for enrollment, CTA behavior, and homepage composition.
- Requires a full repeat of the migration plan to re-collapse.
- Invalidates `decision--event--event-page-is-canonical-event.md` without ADR process.

## Enforcement hints

- No `EventData` type, class, or Pydantic model may be introduced.
- No new `*/events/*` directory, route, or endpoint outside of the public `/api/public/event-pages/*` namespace.
- Any reference to "Event" in new code or docs must resolve to `EventPageData`.
- Add / keep ESLint `no-restricted-imports` entries banning legacy paths once Phase 5 of the migration retires them.

## Source

- `decision--event--event-page-is-canonical-event.md`
- `plan--event--collapse-into-event-page.md`
- Constitution §3.1: "Adding a new entity requires an explicit decision (ADR)"

## Related

- `invariant--architecture--entities-are-finite-and-controlled.md` — sibling invariant; this one specializes the "Event" entity row.
- `bug--event--id-prefix-collision-between-event-and-eventpage.md` — historical symptom.
