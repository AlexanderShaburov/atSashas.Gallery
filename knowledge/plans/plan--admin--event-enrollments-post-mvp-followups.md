---
type: plan
scope: [admin, event, enrollment, followup]
status: proposed
date: 2026-04-22
source_of_truth: false
tags: [enrollment, post-mvp, cleanup, deferred]
---

# Enrollments — Post-MVP Follow-ups

The enrollments management plan
(`plan--admin--event-enrollments-management.md`) shipped MVP scope on
2026-04-22 and is accepted as complete. This note collects items
intentionally **not required for MVP** that may be worth picking up later.

Nothing here is blocking. Each entry is scoped small enough to take on
independently when it becomes useful.

---

## 1. Non-blocking improvements

- **Optimistic UI for row actions.** Today every mutation triggers a full
  `fetchEnrollmentsDetail` refetch. For status / payment toggles this is
  safe but slightly jarring on slow networks. Candidate: local
  state-update on the returned `Enrollment`, with refetch reserved for
  transfer / manual create.
- **Row-level action spinner.** The `inFlight` row dim works, but a
  small inline spinner next to the cell being mutated would communicate
  progress more clearly than opacity alone.
- **`diffContactPatch` note handling.** Currently always sends `note`
  (server-side it's a no-op when unchanged). Pre-diffing against the
  stored value would shrink the PATCH payload; small, not load-bearing.
- **Transfer confirmation step.** Destination selection currently enters
  a one-click transfer. A small confirmation ("Move X from A to B?")
  would reduce mis-click risk, especially across similarly-named
  events.
- **Keyboard navigation in the row menu.** Arrow-up/down + Enter would
  improve accessibility. Today it's mouse-only (Esc closes).
- **Dismissable toast / snackbar** instead of the inline banner for
  successful actions. MVP omits any success toast; admin knows by
  seeing the row change. A light confirmation would reduce ambiguity.

## 2. Deferred architectural concerns (already tracked)

- **User / contact catalog.** Cross-event participant identity is not
  modelled. Tracked in
  `open_question--architecture--user-contact-catalog.md`. Triggers for
  reopening are listed there; do not drift toward this direction
  incrementally — reopen via ADR.
- **Optimistic concurrency on `event_page_repo`.** The Phase 5A
  mutations bump `catalog.version` but the repo does not enforce the
  version check on write. Tracked in
  `open_question--data--inconsistent-optimistic-concurrency.md`.
  Impact is low at single-operator scale; revisit if concurrent admin
  editing becomes real.
- **JSON vault scale tripwires.** `event_pages/catalog.json` holds all
  enrollments. Per `plan--events--cta-registration-system.md` §6.4, the
  split is warranted at > 200 enrollments per event or > 2 MB total.

## 3. Cleanup / refactor candidates (not required for MVP)

- **Legacy duplicate in `entities/event/event.types.ts`.** That file
  still declares a second `Enrollment` interface and a stale
  `PAYMENT_STATUSES = ['pending', 'paid', 'failed']` constant. No
  active importer remains after Phase 1, but the code is still
  shipped. Retire together with the wider legacy `EventData` cleanup
  when it's picked up.
- **Public enrollment URL rename.** `POST /public/events/{id}/enroll`
  is scheduled to become `/public/event-pages/{id}/enroll` per
  `decision--event--event-page-is-canonical-event.md` §"Enrollment
  endpoint URL". Cosmetic; bundle with the same cleanup pass.
- **Stripe webhook does not bump `updatedAt`.** When the webhook
  writes `paymentStatus = paid`, the record's `updatedAt` is not
  touched. Harmless for MVP; worth syncing when we invest in payment
  reconciliation.
- **Pre-existing stray test file.**
  `apps/frontend/src/shared/nav/__tests__/journeySession.test.ts` is a
  validation function mis-named as a test file. `vitest run` reports
  "1 failed file" every run because no `describe` is found. Rename
  (drop `.test.` from the filename) or move out of `__tests__`.
  Present since long before this plan; folding into the next frontend
  cleanup pass is a one-line fix.
- **Shared admin modal primitive.** `ActionModal` lives inside the
  enrollments feature. If other admin surfaces grow a similar modal
  need, promote it to `shared/ui/`. Do NOT extract preemptively — one
  consumer is not a pattern.
- **`MENU_WIDTH` dual source of truth.** `RowActionsMenu.tsx` has
  `MENU_WIDTH = 224`, CSS has `width: 14rem`. Comment notes the
  duplication; if it causes drift, collapse via a shared constant or
  by reading `panelRef.current.offsetWidth` after mount (trades a
  second render for single-source).
- **Deep-link return path**. The current
  `/admin/event-pages?edit=<id>&returnTo=<path>` flow works but is a
  second return mechanism alongside Journey. If more admin surfaces
  start using deep-link returns, consider either: (a) promoting
  Enrollments into `EditorKind` and extending Journey to handle
  path-parameterized routes, or (b) centralizing the `returnTo`
  handling into a small hook. For now, one consumer is fine.
- **`dateStart` accessed via `getattr`** on `EventPageData` (which
  uses `extra='allow'` for preset-specific fields). A typed
  `dateStart: Optional[str]` on the base model would drop the
  defensive `isinstance(..., str)` check in two places. Low value;
  bundle with a wider event-page schema consolidation if that ever
  happens.

---

## Not here by design

- Webhook / Stripe redesign.
- Audit log / history.
- Waitlist, capacity override, overbooking.
- Registrant login portal.
- Cross-event analytics / CRM.
- Multi-occurrence parent event model.

These are explicitly out of scope per the shipped plan's §7 and remain
so until a product-level signal moves them in.

---

## Related

- `plan--admin--event-enrollments-management.md` — shipped plan
- `open_question--architecture--user-contact-catalog.md`
- `open_question--data--inconsistent-optimistic-concurrency.md`
- `plan--events--cta-registration-system.md` — sibling plan (payment,
  notifications, analytics) — still proposed
- `decision--event--event-page-is-canonical-event.md`
