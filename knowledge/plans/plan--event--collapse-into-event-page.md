---
type: plan
scope: [event, data, architecture]
status: implemented
date: 2026-04-22
source_of_truth: false
tags: [event, event-page, migration, legacy-cleanup, adr-ratified]
---

# Collapse Event into EventPage — architecture alignment & legacy cleanup

## Problem

The admin UI has migrated to `EventPageEditor` as the only user-visible event editor, but the knowledge base, domain model invariant, and several backend paths still describe a two-entity world (`Event` + `EventPage` as independent concepts). The enrollment pipeline still reads from the legacy `events/catalog.json`, disconnected from what users actually create. This half-migration is the root of `bug--event--id-prefix-collision-between-event-and-eventpage.md`.

## Goal

Produce a single, explicit, shared understanding of the event architecture, update the knowledge base to describe that understanding, and migrate the implementation so that EventPage is the canonical event entity with working enrollment. Legacy code and data are then removed.

## Non-goals

- Inventing a new entity or renaming the canonical concept to something other than what the code currently calls it. Naming is a sub-decision executed within the migration, not a prerequisite for it.
- Reimplementing enrollment business logic. The existing endpoint's behavior (free vs paid, Stripe path) is reused; only its repo target and route change.
- Resuming Phase 2 of `plan--events--cta-registration-system.md` until this plan is at least through Phase 3.

---

## Audit — current state (2026-04-21)

### Knowledge-base documents that reference the split model

Must be updated to describe the unified model:

- `knowledge/architecture/architecture--data--domain-model.md` — lists Event as first-class entity; EventPage not present. The 5-entity table and the diagram need revision.
- `knowledge/architecture/architecture--editor--event-system.md` — describes two parallel editors in detail. Most of the "Event Editor" half becomes historical.
- `knowledge/specs/spec--editor--event-system-behavior.md` — describes flows for both editors + the Phase 1 CTA behavior. Event Editor section retires; EventPage section stays and absorbs enrollment behavior.
- `knowledge/invariants/invariant--architecture--entities-are-finite-and-controlled.md` — 5-entity table lists Event. Replace with EventPage (or keep name "Event" with EventPage semantics — sub-decision in Phase 1).
- `knowledge/glossary/glossary--system--domain-terms.md` — any "Event" vs "Event Page" definition needs reconciliation.
- `knowledge/index/index--system--project-navigation.md` — cross-reference table lists all of the above; touchpoint for consistency.
- `knowledge/plans/plan--events--cta-registration-system.md` — built on the split assumption; Phase 2 already marked blocked, full plan needs reconciliation pass after this migration.
- `knowledge/bugs/bug--event--id-prefix-collision-between-event-and-eventpage.md` — flip status to `resolved` when this plan completes.
- `rules/CONSTITUTION.md` — mentions "Event" as entity; update to match.

### Code that implements the legacy Event entity

Marked for retirement at the end of this migration:

**Frontend (10 files/dirs)**
- `src/features/admin/eventEditor/` — whole directory: `EventEditor.tsx`, `EventEditor.css`, `eventEditorSession/EventEditorSession.context.tsx`, `api/eventsAdminApi.ts`
- `src/pages/admin/EventsPage.tsx`
- `src/shared/EventsProvider/` — `useEvent.ts`, `eventsApi.ts` (consumers use it for read-side event data; audit for migration to event_pages)
- `src/features/public/api/eventsModule.ts`
- `src/shared/lib/checkers/eventStatusHelpers.ts` — shared EventStatus helpers, audit for reuse
- `src/entities/event/event.types.ts` — `EventData`, `EventStatus`, `PaymentStatus`, `Enrollment`. `EventStatus` / `PaymentStatus` / `Enrollment` must survive (used by EventPage); `EventData` goes away.
- `src/entities/event/event-catalog.types.ts` — `EventCatalog` wrapper around EventData.
- Router: `src/app/router.tsx:146-151` — `/admin/events` route.
- Journey: `src/features/admin/shared/transporter/transporter.ts:20` — `events: '/admin/events'` destination registration. Journey kind `'events'` needs consolidation with `'eventPages'`.

**Backend (5 files/dirs)**
- `apps/admin-backend/app/routers/events/events.py` — full CRUD router + public fetch.
- `apps/admin-backend/app/routers/enrollments/enrollments.py` — reads from `event_repo` + issues Stripe. Must be repointed to `event_page_repo` + adapted for `EventPageData` shape.
- `apps/admin-backend/app/repos/event_repo.py` — legacy repo.
- `apps/admin-backend/app/models/events.py` — `EventData`, `EventStatus`, `Enrollment`, `PaymentStatus`. Like the frontend, `EventStatus` + `Enrollment` + `PaymentStatus` survive (they're already used by EventPage); `EventData` goes away.
- `apps/admin-backend/app/services/stripe_service.py` — `create_checkout_session(event, enrollment_id)` takes `EventData`. Refactor signature to `EventPageData` or a common subset.

### Data

- `vault/json/events/catalog.json` — 5 historical records from Feb–Mar 2026. Pre-migration, not in any user flow today.
- `vault/json/event_pages/catalog.json` — 2 current records dated 2026-04-21. Active.

### What already aligns

- `apps/admin-backend/app/models/event_pages.py:70` — `EventPageData` already declares `enrollments: dict[str, Enrollment] = Field(default_factory=dict)`. Shape is ready; only the endpoint needs to point at it.
- Frontend entity barrel `src/entities/event/index.ts` already exports both sides. Cleanup is subtractive.
- HomeDoc's `eventRef.eventPageId` is already correct (points at EventPage). No HomeDoc changes required.

---

## Proposed phased plan

### Phase 0 — Decision (ADR)

**Goal**: Record the canonical decision so docs and code have something to point at.

Deliverable: `knowledge/decisions/decision--event--event-page-is-canonical-event-entity.md`

Contents:
- Context: the half-migration, the UI-vs-enrollment split, the evidence from the bug doc.
- Decision: EventPage is the canonical event entity. EventData is retired. The user-facing word "Event" refers to what the code today calls `EventPageData`.
- Naming sub-decision: keep `EventPageData` as the in-code type name to minimize churn, OR rename to `EventData` to reunify terminology. Recommend **keep `EventPageData`** in code but use "Event" in user-facing docs + UI — cheapest rename-wise. Revisit if it creates confusion after Phase 5.
- Consequences: which docs/code retire, what breaks, the ID collision becomes moot once legacy is gone.
- Alternatives considered: (a) reconnect legacy enrollment to the two-entity model with a proper cross-ref — rejected because no current user flow creates EventData; (b) merge the two data shapes under a new name — rejected as unnecessary churn.

**Gate**: you ratify the ADR (any edits, any override). No code work until ratified.

### Phase 1 — Knowledge-base alignment — **implemented 2026-04-21**

**Goal**: Every vault document describes the single-entity world. Code still runs on the split — that's fine; docs lead.

Completed updates:

1. **`architecture--data--domain-model.md`** — rewrite the 5-entity table: Event entry references EventPageData shape + `event_pages/catalog.json`. Update the diagram to show Event → enrollments (no separate EventData box). Note ID format `event-YYYYMMDD-{base32(6)}` stays; collision becomes moot post-retirement.
2. **`architecture--editor--event-system.md`** — keep only the "Event Page Editor" half. Drop the parallel "Event Editor" section. Add a brief "Legacy retired" footer citing this plan.
3. **`spec--editor--event-system-behavior.md`** — remove Event Editor flows. Keep EventPage flows. Update the CTA action section to note that `eventId` is no longer a cross-entity reference (the field is retained only for legacy data compatibility — see migration notes in Phase 3).
4. **`invariant--architecture--entities-are-finite-and-controlled.md`** — entity table: "Event" row now points at EventPage semantics. Still 5 entities.
5. **`glossary--system--domain-terms.md`** — reconcile Event / Event Page terminology: one entry.
6. **`index--system--project-navigation.md`** — verify cross-references; remove dead pointers.
7. **`rules/CONSTITUTION.md`** — update Event entity wording to match the unified model. Minor.
8. **`plan--events--cta-registration-system.md`** — remove references to EventData-as-enrollment-target. Unblock Phase 2 once this migration's Phase 3 completes; mark as "awaiting migration Phase 3".
9. **`bug--event--id-prefix-collision-between-event-and-eventpage.md`** — status stays `open` until legacy is physically removed (Phase 5); then flip to `resolved`.

**Gate**: documentation review pass. At this point a reader of only the vault would get a coherent single-entity story.

### Phase 2 — Enrollment backend repoint

**Goal**: `POST /public/events/{event_page_id}/enroll` works against `event_pages/catalog.json`. External contract preserved for the frontend; only the internal repo target changes.

Deliverables:
- `apps/admin-backend/app/routers/enrollments/enrollments.py` — swap `event_repo` for `event_page_repo`. Look up by `event_page_id`. `EventPageData.enrollments` is already the write target.
- `apps/admin-backend/app/services/stripe_service.py:create_checkout_session` — accept `EventPageData` instead of `EventData`. Shape-compatible for `price`, `title`, `id`.
- Keep the URL as `/public/events/{id}/enroll` OR rename to `/public/event-pages/{id}/enroll`. **Proposed**: keep the URL in Phase 2 (contract-compatible) and rename in Phase 5 cleanup. Keeps this phase minimal.
- Integration test: verify that registering against a real EventPage ID now returns 201, no 404, enrollment persists in the page record.

**Gate**: manual QA test — use the Registration CTA with an EventPage's own ID; enrollment completes; the page in `event_pages/catalog.json` grows an `enrollments` entry.

### Phase 3 — Frontend reconciliation — **implemented 2026-04-21**

**Goal**: Frontend types and flows match the canonical model. The "Linked Event ID" confusion is addressed.

Shipped:
- `EventPageData.eventId` field: retained in the schema; marked deprecated in comment + docstring. Consumers no longer read it for dispatch.
- `pages/public/EventPage.tsx`: `EnrollmentForm` now receives `page.id` (the EventPage id) as the enrollment target. Registration CTA gate is `status === 'scheduled'` only — the `!!eventId` check dropped. Analytics `eventId` attribute now carries `page.id` (same as `eventPageId`) for parity.
- `features/admin/eventPageEditor/ui/CtaSection.tsx`: "Linked Event ID" input removed from the register branch. Only `Paid` toggle + `Capacity` remain.
- `features/admin/eventPageEditor/ui/SettingsSection.tsx`: Linked Event ID input kept with "legacy — not used by registration" default-indicator text and an inline hint explaining the post-2026-04-21 semantics.
- `features/admin/eventPageEditor/ui/EventPageEditor.tsx`: preview handler's register branch drops the `!draft.eventId` guard.
- `spec--editor--event-system-behavior.md`: updated to reflect status-only gate + deprecated `eventId`.

Verification: typecheck clean, ESLint clean on all Phase 3 files, 368/368 existing tests pass (no regressions in `entities/event`, `features/admin/eventPageEditor`, `features/public/eventPage`).

### Phase 4 — Legacy data handling — **implemented 2026-04-21**

**Goal**: `events/catalog.json` decommissioned safely, with zero risk of referenced records being orphaned.

Shipped:
- Phase 4.A reference audit run as strict multi-surface ripgrep sweep; artifact at `knowledge/sessions/session--event--phase-4a-reference-audit.md`. Total in-repo matches: 3 files (the catalog itself, the plan document's own audit instructions, one stale UI placeholder string). No test fixtures, scripts, seed files, or data consumers reference the 5 IDs.
- Phase 4.B stale UI placeholder cleaned (`SettingsSection.tsx` Linked Event ID input placeholder generalized to `event-YYYYMMDD-xxxxxx`).
- Phase 4.B `vault/json/events/catalog.json` deleted. Empty parent directory `vault/json/events/` removed.
- Backend full test suite (17 passed, 2 skipped, 0 failed) after deletion. Frontend typecheck clean.

#### Phase 4.A — Reference audit (precondition; do not skip)

Before touching the file, confirm that none of the 5 legacy EventData IDs are referenced elsewhere. Each id: `event-20260214-cx1vra`, `event-20260214-3p50kr`, `event-20260304-wa5mrb`, `event-20260307-yao9xe`, `event-20260323-04op17`.

Required sweeps:

1. **`event_pages/catalog.json`** — check every page's `eventId` field. Any hit here means an EventPage was authored against the legacy shape and enrollments would be lost. Currently known: `event-20260421-ax8x2r` has `eventId == id` (self-ref, not a legacy match) — verify still holds.
2. **`vault/json/**`** — full ripgrep for each id string. Covers HomeDoc, Stream blocks, TextVisuals, MediaItems, any archived or operational files.
3. **`apps/admin-backend/**`** and **`apps/frontend/src/**`** — ripgrep for each id. Catches test fixtures, seed data, hardcoded references.
4. **Test data** — specifically `tests/**`, `__tests__/**`, `fixtures/**`, `*.test.*`.
5. **Analytics JSONL** — at this stage no analytics file exists (Phase 5 of the CTA plan); skip unless the CTA plan has landed Phase 5.
6. **Build artifacts / checked-in logs** — unlikely, but ripgrep covers.
7. **Stripe dashboard / webhooks** — any `metadata.event_id` field in historical Stripe records. Inspect via Stripe dashboard for 2026-02 / 2026-03 sessions. If any real payments were made against these IDs, the archive must preserve the link for audit purposes.

Artifact: a short **Audit Report** (plain markdown in the commit body or a temp file under `knowledge/sessions/`) listing each id and its references-found count. If any id has non-archival references, stop and resolve before proceeding.

#### Phase 4.B — Delete

Only after 4.A is clean. Per `decision--event--event-page-is-canonical-event.md` the 5 legacy records are leftover artifacts from the incomplete migration, not historical business data. **No archive.**

- Delete `vault/json/events/catalog.json`.
- Commit the deletion with a commit message referencing the Audit Report from 4.A.
- If 4.A surfaced any record worth preserving as a live event, it must have already been re-authored as an EventPage in the current editor **before** 4.B runs. 4.B is strictly the cleanup commit.

**Gate**:
- Audit Report shows zero non-trivial references to any of the 5 legacy IDs.
- `grep -r "events/catalog.json"` returns only references in retired code scheduled for Phase 5 removal.
- Reference audit artifact committed alongside the deletion.

### Phase 5 — Legacy code removal — **implemented 2026-04-21**

Executed as a sequence of controlled stages against a safety commit (`edb0d37`):

- **Types relocated** before deletion: `Enrollment`, `EventStatus`, `PaymentStatus` moved to `apps/admin-backend/app/models/enrollments.py` and `apps/frontend/src/entities/event/enrollment.types.ts`. Live consumers repointed; legacy files continue importing their own copies until deleted.
- **Route + journey removed**: `/admin/events` dropped from `router.tsx`; `events: '/admin/events'` removed from transporter; `'events'` removed from `EditorKind` + `EditorKey` unions.
- **EventEditor + EventsPage deleted**: `src/features/admin/eventEditor/` (whole tree), `src/pages/admin/EventsPage.tsx`.
- **Admin block-preview event rendering retired**: `EventCtaBlockComponent`, `GalleryEventSlot`, `EventPicker` (tree) deleted; `BlockRenderer`, `SingleBlockEditor`, `TemplateBlockCard`, `GalleryComponent`, `BlockPreview/index.ts` updated to drop `eventCta` branches.
- **Public event rendering retired**: `EventCtaView` (+ CSS) and `GallerySlotEventView` (+ CSS) deleted; `GalleryBlock` drops the `eventCta` branch; `ImageComponent` drops `renderEventSlot` prop + `isEventItem` usage.
- **EventsProvider layer deleted**: `src/shared/EventsProvider/` (provider, loader, useEvent) and `src/features/public/api/eventsModule.ts` removed; `router.tsx` drops the loader wraps.
- **Event-block plumbing retired**: `EventCtaBlock`, `GalleryEventItem` types removed from `entities/block/block.types.ts` + barrel; `eventSlot`/`eventPickEvent`/`eventPickBackground` BlockHit kinds and `EditTarget` variants removed; `normalizeEventCtaBlock` removed from `normalizeBlock.ts`; `blockSetEventId`/`blockSetEventBackground` removed from `journey.types.ts` return effect union and from `BlockReturnKind`; `createEventPickTicket`/`createBackgroundPickTicket` and their dispatchers removed from the block editor session; `createEventCtaTemplateBlock` removed from templates; `isEventItem` guard removed from `blockItemGuards.ts`; `GalleryBlockView`'s `renderEventSlot` prop removed; `validators.ts` gallery-item validation simplified to art-only.
- **Dead helper removed**: `src/shared/lib/checkers/eventStatusHelpers.ts` deleted (guardrail caught it as the sole remaining `EventData` importer).
- **Backend legacy retired**: `apps/admin-backend/app/routers/events/events.py`, `apps/admin-backend/app/repos/event_repo.py`, `apps/admin-backend/app/models/events.py` deleted; `main.py` no longer registers `events.public_router` / `events.admin_router`.
- **ESLint guardrail**: project-wide `no-restricted-imports` banning `@/shared/EventsProvider/**`, `@/features/admin/eventEditor/**`, `@/features/public/api/eventsModule*`, and `EventData` from `@/entities/event`. Project-wide `no-restricted-syntax` matching literal string fragments `/api/public/events` (disambiguated from `/api/public/event-pages`) and `events/catalog.json`. Violations fail lint.

Verification:
- `npx tsc --noEmit`: 0 errors.
- Frontend vitest: 453 passing (19 files), only pre-existing helper file `journeySession.test.ts` absent of test suites (unchanged).
- Backend `pytest`: 17 passed, 2 skipped (pre-existing).
- FastAPI route enumeration smoke check: no legacy `/admin/events*` or `/public/events*` (except the preserved `/public/events/{id}/enroll` enrollment alias; URL rename deferred).
- Post-deletion `rg EventData|event_repo|/admin/events|EventsProvider|eventsModule|EventCtaBlock|GalleryEventItem|GalleryEventSlot|EventCtaView|GallerySlotEventView|EventPicker` in `apps/`: 0 matches (aside from guardrail strings in `eslint.config.js` and this plan document).

Known deferrals (out of strict Phase 5 scope):
- URL rename `/public/events/{id}/enroll` → `/public/event-pages/{id}/enroll`: deferred to a later cycle for contract stability. Tracked in this plan's "open decisions" #2.
- Pre-existing unused-variable / explicit-any lint warnings in unrelated files: not introduced by this phase; outside scope.


**Goal**: The EventEditor and EventData no longer exist.

Deliverables (in order — each a standalone commit to minimize blast radius):

1. **Route + journey**: remove `/admin/events` from router; remove `events: '/admin/events'` from transporter. Journey kind `'events'` consolidates with `'eventPages'` (or is removed if unused after the router change).
2. **Admin UI pages**: delete `src/pages/admin/EventsPage.tsx`, `src/features/admin/eventEditor/` (whole tree).
3. **Shared providers**: delete `src/shared/EventsProvider/*` and `src/features/public/api/eventsModule.ts`. Audit consumers first; repoint surviving ones to `event_pages` catalog APIs.
4. **Entity layer**: delete `src/entities/event/event.types.ts` (EventData specifically), `src/entities/event/event-catalog.types.ts`. Preserve `EventStatus`, `PaymentStatus`, `Enrollment` by relocating to a surviving file (likely `ctaAction.ts` → rename to `registration.ts` or a new `enrollment.types.ts`).
5. **Backend router**: delete `apps/admin-backend/app/routers/events/events.py` and remove its inclusion from `main.py`.
6. **Backend repo/model**: delete `apps/admin-backend/app/repos/event_repo.py`, `apps/admin-backend/app/models/events.py`. Move `Enrollment`, `EventStatus`, `PaymentStatus` to `apps/admin-backend/app/models/enrollments.py` (new file) or inline in `event_pages.py`. `apps/admin-backend/app/models/event_pages.py:13` import fixed accordingly.
7. **ESLint guardrail**: add `no-restricted-imports` entry banning `@/features/admin/eventEditor/**` so reintroduction is caught.
8. **URL cleanup** (optional polish): rename `/public/events/{id}/enroll` → `/public/event-pages/{id}/enroll`. Frontend `enrollmentApi.ts` updates accordingly. Keep behind a brief compat redirect or do cleanly — low-risk in this codebase because there's one caller.

**Gate**: `grep -r "EventData\|event_repo\|/admin/events"` returns zero results in `apps/`. Typecheck + full test suite green. Manual QA of registration still works.

### Phase 6 — Post-cleanup verification + vault sync — **implemented 2026-04-22**

Shipped:
- Manual QA pass across event editor, registration CTA, public page, draft/scheduled gating, editor preview, homepage, streams, and legacy-surface absence. Registration end-to-end structurally verified (payment path returns "Payment service unavailable" as expected in this env). No regressions in neighbouring surfaces.
- `bug--event--id-prefix-collision-between-event-and-eventpage.md` flipped to `status: fixed` with resolution note.
- `plan--events--cta-registration-system.md` Phase 2 unblocked against the canonical entity (Event picker re-scoped).
- Nav index (`knowledge/index/index--system--project-navigation.md`) re-verified: decision count 6 + invariant count 9 both correct; no stale pointers.
- One unrelated React render-cycle warning observed in `EventPageEditorSessionProvider` — not migration-caused; tracked as a separate concern (see `knowledge/open-questions/open_question--editor--eventpage-session-provider-render-warning.md`).

**Goal**: Close the loop.

Deliverables:
- Run typecheck + ESLint + full test suite.
- Flip `bug--event--id-prefix-collision-between-event-and-eventpage.md` to `status: resolved` with a resolution note.
- Flip this plan document to `status: implemented` with completion notes per phase.
- Update `index--system--project-navigation.md` for any final shifts.
- Unblock Phase 2 of `plan--events--cta-registration-system.md`; update its references to the canonical entity model.

**Gate**: All Phase-5 greps clean. Vault reviewed end-to-end for consistency.

---

## Dependencies between phases

```
Phase 0 (ADR) ───────┐
                     ▼
           Phase 1 (docs aligned) ──┐
                                    ▼
                       Phase 2 (enrollment repoint) ──┐
                                                      ▼
                                       Phase 3 (frontend) ──┐
                                                            ▼
                                       Phase 4 (data) ──── Phase 5 (code cleanup) ──▶ Phase 6 (verify)
```

Phase 4 and Phase 5 are mostly independent but should land in the same release window so legacy data and legacy code leave together.

---

## Risk register

- **Stripe service signature change** (Phase 2): `create_checkout_session` currently takes `EventData`. If signature is invoked from more than one place, risk missed call sites. Mitigation: grep before refactor; single call site expected.
- **`Enrollment` type move** (Phase 5): shared between backend models. Risk of broken imports. Mitigation: relocate in a single commit that updates all importers in one shot.
- **Journey kind consolidation** (Phase 5): `'events'` journey ticket kind is distinct from `'eventPages'`. If any inbound journey still targets `'events'`, dropping it breaks flows. Mitigation: search for dispatches first; likely none, but verify.
- **Legacy data loss** (Phase 4): deleting `events/catalog.json` without archiving would destroy history. Mitigation: archive to `vault/json/_archive/` before deletion; commit the archive.
- **CTA Phase 2 regression**: picker design assumed the split. After migration, the picker might be redundant (every EventPage IS the event). Mitigation: revisit `plan--events--cta-registration-system.md` Phase 2 scope during Phase 6 of this migration.

---

## Out of scope

- Reviving / extending the EventEditor UI.
- Changing the ID format for EventPage (no longer needed once legacy is gone).
- Multi-currency, capacity enforcement, waitlist, analytics backend (all tracked in the CTA plan).
- The Event picker via Journey in `plan--events--cta-registration-system.md` Phase 2. Revisit after this migration completes; may become unnecessary.

---

## Open decisions (for the ADR)

1. **Name in code**: keep `EventPageData` / `event_page_repo` / `event_pages/catalog.json` (cheap, concrete), or rename to `EventData` / `event_repo` / `events/catalog.json` (slightly cleaner but a large churn because the legacy files already exist under those names). **Proposed default**: keep current names to avoid a two-step rename. Revisit only if user-facing docs feel incoherent.
2. **Enrollment URL**: `/public/events/{id}/enroll` (current, preserved through Phase 2) or `/public/event-pages/{id}/enroll` (rename in Phase 5). **Proposed default**: rename in Phase 5 for clarity.
3. **Fate of legacy 5 EventData records**: archive + delete (proposed) vs port each to EventPage (more work, only valuable if any are referenced). Inspect in Phase 4 to decide per-record.

---

## Related

- `knowledge/bugs/bug--event--id-prefix-collision-between-event-and-eventpage.md`
- `knowledge/plans/plan--events--cta-registration-system.md`
- `knowledge/architecture/architecture--data--domain-model.md`
- `knowledge/architecture/architecture--editor--event-system.md`
- `knowledge/specs/spec--editor--event-system-behavior.md`
- `knowledge/invariants/invariant--architecture--entities-are-finite-and-controlled.md`
- `rules/CONSTITUTION.md`
