---
type: decision
scope: [event, data, architecture]
status: active
date: 2026-04-21
source_of_truth: true
tags: [event, event-page, canonical-entity, legacy-retired, adr]
---

# EventPage is the canonical event entity

## Context

The SashaGallery admin UI was migrated to `EventPageEditor` as the only user-visible surface for authoring events. The dashboard "Events" tile (`AdminIndexPage.tsx:37`), the admin header nav (`AdminHeader.tsx:66`), and all new flows write to `vault/json/event_pages/catalog.json`. The legacy `EventEditor` at `/admin/events`, while still mounted in the router, has no entry point from the UI and no user flow reaches it.

The enrollment backend (`apps/admin-backend/app/routers/enrollments/enrollments.py`) was **not** moved as part of that migration. It still reads from `vault/json/events/catalog.json` via `event_repo`. Consequence: any enrollment submitted against a record the user authored in the visible UI returns `404 Event not found`, because the ID maps to an `EventPageData` record that the enrollment repo cannot see.

Both entities further share the ID format `event-YYYYMMDD-{base32(6)}`, producing an ID collision class documented in `bug--event--id-prefix-collision-between-event-and-eventpage.md`. The earlier framing of that bug as "missing validation" was corrected: the real issue is the half-completed migration.

The knowledge base still describes a two-entity world:
- `architecture--data--domain-model.md` lists Event as a first-class entity; EventPage is not in the 5-entity table.
- `architecture--editor--event-system.md` describes two parallel editors.
- `invariant--architecture--entities-are-finite-and-controlled.md` and `rules/CONSTITUTION.md` ratify Event (not EventPage).

A single, explicit, shared architectural model is needed before CTA & Registration implementation continues. Phase 2 of `plan--events--cta-registration-system.md` is blocked pending this decision.

## Decision

**EventPage is the canonical event entity.**

Concretely:

1. The user-facing concept "Event" refers to what the code today calls `EventPageData` (frontend) / `EventPageData` Pydantic model (backend). It is the preset-based record authored in `/admin/event-pages` and stored in `vault/json/event_pages/catalog.json`.
2. The legacy `EventData` entity is **retired**. Its route (`/admin/events`), editor (`EventEditor`), session context, API (`/api/admin/events`, `/api/public/events`), repo (`event_repo`), Pydantic model (`EventData`), and storage file (`vault/json/events/catalog.json`) are scheduled for removal.
3. **Enrollments live on EventPage.** `EventPageData.enrollments: dict[str, Enrollment]` already exists in the schema (`apps/admin-backend/app/models/event_pages.py:70`) and becomes the single source of truth for registration records.
4. The `Enrollment`, `EventStatus`, and `PaymentStatus` types survive the retirement by relocating to a surviving module (proposed: new `apps/admin-backend/app/models/enrollments.py`; frontend mirror at `src/entities/event/enrollment.types.ts`).
5. `HomeDoc.items[*].eventRef.eventPageId` is already correct (points at EventPageData) — no change.

### Naming

- **In code**: keep `EventPageData`, `event_page_repo`, `event_pages/catalog.json`, `/api/admin/event-pages`. Renaming to `EventData` etc. would collide with retired legacy file names during migration and increase churn without semantic gain. This is revisitable later as a pure-rename refactor if the terminology becomes confusing, but is not blocking.
- **In user-facing text and vault docs**: use "Event" for the concept; use "EventPage" only when a sentence needs to disambiguate the internal shape from the user concept. Example: "Create an Event" in UI copy; "EventPage editor" in architecture docs.

### Enrollment endpoint URL

`POST /public/events/{id}/enroll` **is renamed to** `POST /public/event-pages/{id}/enroll` as part of the final cleanup phase of the migration. Phase 2 of the migration keeps the old URL for contract compatibility; Phase 5 renames. Frontend `enrollmentApi.ts` updates accordingly. There is a single frontend caller.

### Legacy 5 EventData records (as of 2026-04-21)

**Delete outright; do not archive.** The 5 records are leftover artifacts from an incomplete migration — not historical business data. Preserving them would carry the retired architecture forward as a frozen file and muddy the target "single event entity" state. The reference audit (migration Phase 4.A) runs as a final safety check only; a clean audit is the precondition for deletion, not justification for archival.

### ID format

`EventPage.id` continues to use `event-YYYYMMDD-{base32(6)}`. The collision class dissolves the moment `EventData` is retired — two entities no longer share the prefix.

## Enforcement

This decision is paired with `invariant--architecture--single-event-entity.md`: "The system has exactly one event entity." That invariant is the forward-looking hook preventing re-introduction of the split — no `EventData` type, no `/events/` route, no parallel storage. Any future use case that seems to require a second event representation triggers a new ADR replacing or amending this one, not a quiet re-introduction.

## Consequences

**Positive**

- Single source of truth. "What is an event?" has one answer at every layer: UI, storage, API, docs.
- Enrollments work end-to-end against records users actually create.
- The ID collision class goes away — no picker or validation layer needed to disambiguate.
- Domain model becomes describable in the Constitution without a hidden second entity.
- `EventPageData.eventId` (self-reference legacy field) becomes deprecated cleanly, removable in a future pass.
- Invariant `single-event-entity` prevents drift.

**Negative**

- Migration touches 9 vault documents and 15+ code files across frontend and backend.
- Legacy 5 EventData records require manual classification (archive / re-author / delete). Small scope but human attention required.
- Any bookmarked URL or deep link to `/admin/events` stops working. Acceptable — it was never linked from any visible flow.
- `EventPageData.eventId` lives on in the schema for one more cycle to tolerate legacy records during transition. Minor type noise.

**Operational**

- Before Phase 4 data deletion, a reference audit confirms no code, tests, analytics, seed data, or JSON references hold the legacy event IDs.
- `EventStatus` is unchanged (`draft | scheduled | closed`) and continues to gate public visibility of EventPages.
- Stripe integration's `create_checkout_session(event, enrollment_id)` signature changes from `EventData` to `EventPageData`. Shape-compatible (`id`, `title`, `price` all exist on EventPage).
- Webhooks carrying `metadata.event_id` continue to work as long as the ID is interpreted as an `EventPage.id` post-migration. No webhook URL change.

## Alternatives considered

- **Reconnect the two-entity model**: keep Event and EventPage as distinct entities, expose an in-UI flow to create the underlying EventData when configuring an EventPage's CTA. Rejected. Users never experience "Event" as a separate concept in the current UI; forcing them to understand a parallel catalog solves nothing and makes the editor more complex.
- **Merge into a new entity with a new name** (e.g., `EventRecord`): rejected. Unnecessary churn. The existing `EventPageData` already has the right shape (presets, enrollments, CTA config); renaming it yields no behavioral benefit.
- **Rename URL structure first, then migrate data later**: rejected. Contract stability during data migration matters more than URL cleanliness; the rename piggybacks on the cleanup phase where it's cheapest.
- **Keep EventEditor as a hidden admin tool**: rejected. Dead code drift is the cause of the current confusion; half-alive code is worse than retired code.

## Future

If multi-occurrence events (series, recurring workshops) become a product requirement, the current `EventPageData` shape may need extension (e.g., instances array). That's a forward-looking data model change and does not change the canonical entity decision taken here.

If a future product need for a separate "pure event record" (without presentational presets) emerges, it should be revisited as a new ADR rather than by reactivating retired code.

## Related

- `knowledge/invariants/invariant--architecture--single-event-entity.md` — enforcement hook preventing re-introduction of a parallel event model
- `knowledge/plans/plan--event--collapse-into-event-page.md` — execution plan for this decision
- `knowledge/bugs/bug--event--id-prefix-collision-between-event-and-eventpage.md` — symptom that surfaced the misalignment
- `knowledge/plans/plan--events--cta-registration-system.md` — CTA & Registration work built on the pre-decision model; Phase 2 unblocks post-migration
- `knowledge/architecture/architecture--data--domain-model.md` — updated in migration Phase 1 to reflect this decision
- `knowledge/architecture/architecture--editor--event-system.md` — updated in migration Phase 1
- `knowledge/specs/spec--editor--event-system-behavior.md` — updated in migration Phase 1
- `knowledge/invariants/invariant--architecture--entities-are-finite-and-controlled.md` — updated in migration Phase 1
- `rules/CONSTITUTION.md` — updated in migration Phase 1
