---
type: plan
scope: [admin, event, enrollment]
status: implemented
date: 2026-04-22
revised_date: 2026-04-22
implemented_date: 2026-04-22
source_of_truth: false
tags: [event, enrollment, admin, mvp, one-off-events]
---

# Admin Event Enrollments Management — Execution Plan

## Revision note (2026-04-22)

This plan replaces the earlier draft `plan--admin--event-registration-management.md`
(same author, same day). Revisions applied per user direction:

- Terminology: **Enrollments** (not "registrations") across UI, routes, docs.
  The backend already uses `Enrollment` / `enrollments`; no rename needed.
- Capacity override removed from MVP — full events reject both public and
  admin creates.
- Status model simplified: `new` dropped, `awaiting_payment` dropped (derived
  at render time from `paymentStatus + event.isPaid`).
- Deep link from event enrollments detail → Event Page editor added as a
  first-class deliverable.
- Future user/contact catalog moved to a dedicated open question; explicitly
  out of scope here.

## Intent

Give admins an operational view of enrollments: a top-level list of event
occurrences with enrollments, per-occurrence participant rosters, and
hands-on controls (status, payment, edits, manual create, cancel, transfer).
Each event occurrence is one `EventPageData` record — no abstract parent
event, no multi-day or course structures.

## Relationship to existing plans

- Built on the canonical event model ratified in
  `decision--event--event-page-is-canonical-event.md` and enforced by
  `invariant--architecture--single-event-entity.md`.
- Complements `plan--events--cta-registration-system.md`:
  - That plan owns **public registration flow, Stripe/payment, analytics,
    notifications, CTA config** and treats the admin enrollments list as an
    editor-embedded sidebar tab.
  - This plan **supersedes the admin-UI shape** from that plan: the primary
    admin surface here is a **top-level `/admin/enrollments` list of event
    occurrences**, not a tab inside the Event Page Editor. A deep link from
    the detail view back to the Event Page editor preserves the editor
    workflow.
- Phase 2 of the CTA plan currently reads `EventPageData.enrollments`. This
  plan extends that field (see §3 Data Model) without renaming it. The two
  plans must be resequenced so the extensions land before the CTA plan's
  admin-tab work.

## Product constraints (fixed — do not redesign)

1. **One event per date.** Each occurrence is its own `EventPageData`.
2. **No multi-day, courses, bundles, or date ranges.**
3. **Enrollments live on the event record.** No global enrollments table.
   `vault/json/event_pages/catalog.json > pages[id].enrollments`.
4. **Enrollment identity is event-scoped.** Transfer = remove + create
   elsewhere (two records, never a relational reassignment).
5. **Two separate status fields**: enrollment *process* status and *payment*
   status. Never collapse them.
6. **Capacity limit per event, no waitlist, no override.** Full events reject
   creates from public and admin alike.
7. **Required participant data**: name + contact (email and/or phone, at
   least one of them).
8. **Admin can**: view / filter / edit contact / change status / toggle
   payment / cancel / create manually / transfer. No audit log / history in
   MVP.
9. **Enrollment-only scope.** This plan does not introduce a user/contact
   catalog or cross-event identity merging. See
   `open_question--architecture--user-contact-catalog.md`.

---

## 1. System decomposition

Five subsystems, each implementable independently with a meaningful
intermediate result:

1. **Enrollment data model** — extend `Enrollment` with the dual-status model
   and optional phone/note; define the transfer semantics.
2. **Public enrollment flow (input side only)** — thin slice: the form
   posts an `Enrollment`; the rest of the public CTA/payment story stays
   where `plan--events--cta-registration-system.md` handles it.
3. **Admin Enrollments surface (top-level)** — a new route
   `/admin/enrollments` with event-occurrence list, upcoming/past filter,
   and per-event detail view.
4. **Admin enrollment actions** — status/payment edits, contact edits,
   cancel, manual create, transfer.
5. **Capacity enforcement** — backend-side rejection when full; surfaced in
   the UI on both public and admin forms.

Boundary rules (consistent with existing invariants):

- Enrollment is a **sub-record of the Event** (`EventPageData`). It is not a
  new domain entity — the ADR §3.1 rule is not triggered.
- Admin UI reads and writes enrollments; public UI only writes (creates) and
  reads own confirmation. No cross-writing of presentation fields.
- Transfer is atomic at the UX layer but implemented as two writes
  (`remove` + `create`). A server-side helper endpoint wraps both, but the
  data model sees independent records — no relational reassignment.

---

## 2. Step-by-step implementation plan

Each phase lands in a single reviewable slice with a testable outcome. No
phase leaves a half-wired state. Phase boundaries are confirmation points
per the orchestration spec.

### Phase 1 — Data model extension — **implemented 2026-04-22**

**Outcome**: `Enrollment` shape on backend + frontend matches this plan;
existing records keep working.

Delivered:
- Extended `apps/admin-backend/app/models/enrollments.py`:
  - `EnrollmentStatus` enum (six values from §3).
  - `PaymentStatus` simplified to `unpaid | paid`.
  - Added `phone`, `note`, `status`, `updatedAt`, `createdBy` to `Enrollment`.
  - `model_validator(mode='before')` hydrates pre-Phase-1 records: legacy
    `paymentStatus` (`pending` / `failed`) → `unpaid`; missing `status` →
    `pending`; missing `createdBy` → `public`; missing `updatedAt` mirrors
    `createdAt`. Missing `createdAt` surfaces as a validation error (no
    silent timestamp invention).
  - `extra='forbid'` preserved — unknown keys still rejected.
- Router updated (`apps/admin-backend/app/routers/enrollments/enrollments.py`):
  public enroll handler now passes `updatedAt=now, createdBy='public'` and
  uses `PaymentStatus.unpaid` in place of the retired `.pending`. Webhook
  path unchanged.
- Frontend mirror updated (`apps/frontend/src/entities/event/enrollment.types.ts`):
  added `ENROLLMENT_STATUSES`, `ENROLLMENT_CREATED_BY`, extended `Enrollment`
  interface; `PAYMENT_STATUSES` is now `['unpaid', 'paid']`. Index barrel
  re-exports the new symbols.
- Tests:
  - `apps/admin-backend/tests/test_unit_enrollment_model.py` — 9 tests
    covering legacy hydration, default injection, payment coercion, direct
    construction defaults, `extra='forbid'` preservation, and
    `createdAt`-required behavior.
  - `apps/frontend/src/entities/event/__tests__/enrollment.types.test.ts` —
    6 tests covering the constants surface and the `satisfies Enrollment`
    build contract.
  - Existing `stage3proof.test.ts` and `eventRenderContext.test.ts`
    updated to the new shape (no test logic change beyond moving from
    `'pending' | 'failed'` literals to `'unpaid'`).

Verification: backend `pytest` — 26/26 pass (9 new + 17 pre-existing);
frontend `tsc --noEmit` — clean; frontend `vitest` — 459/459 pass. One
pre-existing unrelated file (`shared/nav/__tests__/journeySession.test.ts`)
is a validation function mis-named as a test suite; out of Phase 1 scope.

Gate met: existing public enrollment path still works (`test_enrollments_api.py`
all green); backend hydrates both old-shape and new-shape records.

### Phase 2 — Public enrollment (minimum slice) — **implemented 2026-04-22**

**Outcome**: public form posts an `Enrollment` with the new shape; capacity
is enforced.

Delivered:
- Backend `EnrollRequest` extended (`apps/admin-backend/app/models/enrollments.py`):
  optional `phone` and `note`, `email` relaxed to optional, and a
  `model_validator(mode='after')` that requires at least one of email or
  phone (whitespace-only values do not count). The storage `Enrollment`
  model stays permissive to tolerate legacy records.
- Router (`apps/admin-backend/app/routers/enrollments/enrollments.py`):
  public enroll now normalizes empty/whitespace contact fields to `None`,
  passes `phone` / `note` through, and enforces capacity via two helpers
  (`_get_event_capacity`, `_count_active_enrollments`). Capacity rules:
  - Read `page.ctaAction.capacity` only when `ctaAction.kind == 'register'`;
    any other kind or missing ctaAction → unbounded.
  - Active count = enrollments whose `status` is not a cancellation state.
  - Full → `HTTPException(status_code=409, detail="Event is at capacity")`.
  Creation defaults unchanged: `status = pending`, `paymentStatus =
  unpaid | paid` by event price, `createdBy = 'public'`, `updatedAt = now`.
- Frontend API client (`enrollmentApi.ts`): `EnrollPayload` now carries
  `phone?` / `note?`; a typed `EnrollError` surfaces `capacity |
  validation | not_open | not_found | server` so the form can distinguish
  409 from 422. JSON `detail` is extracted (string or FastAPI issue array)
  with a statusText fallback.
- Form (`EnrollmentForm.tsx`) — minimal change, no CTA redesign:
  adds phone input, textarea note input, email-or-phone gate, and a
  human-readable "This event is full." message on 409. Validation logic is
  extracted to a pure helper (`enrollmentFormValidation.ts`) for testing.
  CSS: three additive classes (`--textarea`, `--error`, `__label-hint`).
- Tests:
  - Backend `test_enrollments_api.py` — 7 new integration tests:
    email-only (existing, extended), phone-only, both, neither (422),
    blank-both (422), at-capacity (409), below-capacity with same-boundary
    acceptance, unbounded-event acceptance. Plus assertions that creation
    defaults land correctly (`status`, `paymentStatus`, `createdBy`,
    `updatedAt`).
  - Backend conftest seeds two new capacity-configured events
    (`event-20260421-cap001` capacity=1; `event-20260421-cap002`
    capacity=2).
  - Frontend `enrollmentFormValidation.test.ts` — 8 tests covering the
    email-or-phone matrix, whitespace handling, and malformed-email gate.
  - Frontend `enrollmentApi.test.ts` — 8 tests covering HTTP→code mapping
    (capacity / validation / not_found / server), JSON-array detail
    extraction, non-JSON fallback, and request body shape.

Verification: backend `pytest` — 33/33 pass (7 new + 26 from Phase 1);
frontend `tsc --noEmit` — clean; frontend `vitest` — 475/475 pass
(unrelated pre-existing `journeySession.test.ts` skip persists).

Gate met: submit enrollments with phone-only and with both channels
succeeds; missing-both is rejected at 422; capacity=1 event accepts the
first enrollment and rejects the second with 409; the event's
`enrollments` dict contains the new records with the expected defaults.

### Phase 3 — Admin Enrollments top-level screen — **implemented 2026-04-22**

**Outcome**: admin has a working `/admin/enrollments` list of event
occurrences with upcoming/past filter.

Delivered:
- Backend endpoint `GET /admin/enrollments/overview` (in
  `apps/admin-backend/app/routers/enrollments/enrollments.py`): returns a
  list of `EnrollmentOverviewRow` aggregates derived from
  `event_page_repo.get_all()`. Counting rules match the plan: `totalCount`,
  `paidCount` (paymentStatus == 'paid'), `cancelledCount` (status in
  cancelled_by_user / cancelled_by_admin). `capacity` is read from the CTA
  only for register-kind actions; otherwise null. `dateStart` is read via
  `getattr` on the `extra='allow'` EventPageData and serialized as null
  when absent. No new storage; no global enrollments table.
- Frontend surface under `features/admin/enrollments/`:
  - `types.ts` mirrors the backend row shape.
  - `api/enrollmentsAdminApi.ts` — thin `fetchEnrollmentsOverview` client.
  - `filterAndSort.ts` — pure partitioning + sorting: Upcoming (dateStart
    >= today OR missing; asc), Past (dateStart < today; desc), All (asc);
    missing dates sink to the end in every view. `today` is a
    YYYY-MM-DD boundary in the caller's local time.
  - `ui/AdminEnrollmentsList.tsx` + CSS — tabbed list, tab counters,
    loading / error / empty states, status pill, "no date" warning badge
    for missing `dateStart`.
- Page wrappers:
  - `pages/admin/AdminEnrollmentsPage.tsx` — mounts the feature component.
  - `pages/admin/AdminEnrollmentDetailPage.tsx` — Phase 4 placeholder
    (shows "will be implemented in Phase 4" + back link), so row clicks
    do not 404.
- Router (`app/router.tsx`): added `/admin/enrollments` and
  `/admin/enrollments/:eventPageId` under the admin root; both auth-gated
  by the existing `AdminRoot` wrap.
- Dashboard tile: "Enrollments" entry added to `AdminIndexPage` between
  Events and Media, matching the existing tile pattern.
- Tests:
  - Backend `test_enrollments_overview_api.py` — 7 integration tests:
    row present for every event page, shape for unbounded events, shape
    for capacity-configured events, paidCount reflects only paid
    paymentStatus, cancelledCount covers both cancellation states
    (seeded via direct `event_page_repo.session()` mutation since the
    status-PATCH endpoints are Phase 5), missing `dateStart` surfaces as
    null, and JSON response content-type.
  - Backend conftest seeded one additional event
    (`event-20260421-ovw001`) used exclusively by the Phase 3 paid-count
    test to avoid session-ordering collisions with Phase 2's cap001 /
    cap002.
  - Frontend `filterAndSort.test.ts` — 13 unit tests: `dayPart`
    normalization, `todayIso` formatting, `sortByDate` ascending /
    descending with missing-date handling and title tie-break,
    `partitionAndSort` for upcoming (same-day counts as upcoming), past
    (strict past only; missing excluded), all (every row; missing last),
    empty-input handling, and datetime-with-time equivalence.

Verification: backend `pytest` — 40/40 pass (7 new + 33 from Phase 2);
frontend `tsc --noEmit` — clean; frontend `vitest` — 488/488 pass (same
pre-existing unrelated `journeySession.test.ts` file issue). No Phase 4
detail logic implemented; row clicks land on the explicit placeholder.

Gate met: the list renders aggregates for the seeded set; tab counts
reflect partition sizes; Upcoming / Past / All toggles produce the
expected row sets per the semantics above. Manual browser verification
remains an admin-side step — unit and type-checks verify correctness, not
visual polish.

### Phase 4 — Event enrollments detail view — **implemented 2026-04-22**

**Outcome**: clicking an event opens a detail page with the full roster,
summary strip, and deep link back to the Event Page editor.

Delivered:
- Backend `GET /admin/enrollments/{event_id}` (in
  `apps/admin-backend/app/routers/enrollments/enrollments.py`): returns
  `{ event: { id, title, dateStart, capacity, status }, enrollments:
  Enrollment[] }`. Event header reuses the `EnrollmentsDetailEvent`
  Pydantic model; `enrollments` is the `list(page.enrollments.values())`
  from the existing repo — no new storage. Unknown id yields 404. Route
  declared after `/enrollments/overview` so the path doesn't shadow.
- Summary counts are derived on the **frontend** from the returned
  `enrollments` list (simpler contract, no duplication of server math).
  Helper: `features/admin/enrollments/summary.ts` — `deriveSummary` returns
  `{ totalCount, paidCount, cancelledCount, activeCount }`. `activeCount`
  excludes cancellations so the capacity strip reflects freed-up seats.
- Frontend detail surface:
  - `features/admin/enrollments/ui/AdminEnrollmentsDetail.tsx` + CSS —
    header (title · date · event status · back link · "Open in Event
    Page editor" deep link), summary strip (enrolled/capacity · paid/total
    · cancelled), roster table with loading / error / not-found / empty
    states. Row action column renders a disabled ⋯ button with a "coming
    in Phase 5" tooltip — no action behavior wired.
  - `features/admin/enrollments/contactDisplay.ts` — pure helper
    `contactLines(e)` that returns `[{kind:'email'|'phone', value}]` with
    email first, whitespace-only values treated as missing.
- Detail page (`pages/admin/AdminEnrollmentDetailPage.tsx`): replaces the
  Phase 3 placeholder; reads `eventPageId` from the URL and mounts the
  detail component. Missing id renders a clear "missing event id" state
  with a back link (no crash path).
- Deep link: "Open in Event Page editor" points at
  `/admin/event-pages?edit=<id>`. EventPage editor bootstrap
  (`EventPageEditorSession.context.tsx`) extended to consume the `edit`
  query param when no Journey ticket is active: verifies the event exists
  in the catalog, opens it in edit mode (`['select', 'edit']`), and
  strips the param from the URL via `history.replaceState` so back/forward
  navigation does not re-trigger. Existing Journey path is unchanged.
- Frontend `Enrollment` interface updated: `email?: string` (previously
  required) to match the Phase 2 backend storage type. No other consumer
  broke — `contactDisplay` already uses `(e.email ?? '').trim()`.
- Frontend API client:
  `features/admin/enrollments/api/enrollmentsAdminApi.ts` —
  `fetchEnrollmentsDetail(id, signal?)` with typed `DetailNotFoundError`
  (maps HTTP 404 explicitly).

Tests:
- Backend `test_enrollments_detail_api.py` — 5 tests:
  unbounded event shape (capacity=null, dateStart=null), capacity-configured
  event shape, 404 for unknown id, route-ordering regression check against
  `/enrollments/overview`, and phone+note roundtrip on a phone-only
  enrollment confirming optional contact serialization.
- Frontend:
  - `summary.test.ts` — 6 tests for `deriveSummary`: empty input, paid
    count, cancellation coverage across both states, exclusion of
    `no_show`/`attended` from cancelled, activeCount = total − cancelled,
    independent combination of paid + cancelled.
  - `contactDisplay.test.ts` — 7 tests: email-only, phone-only, both
    (email first), whitespace trimming, empty/null handling, plain-text
    join, empty string.
  - `enrollmentsAdminApi.test.ts` — 5 tests: 200 parsed body, 404 →
    `DetailNotFoundError`, non-404 error → generic Error, URL encoding of
    the event id, regression check that the Phase 3 `fetchEnrollmentsOverview`
    still resolves.

Verification: backend `pytest` — 45/45 pass (5 new + 40 from Phase 3);
frontend `tsc --noEmit` — clean; frontend `vitest` — 506/506 pass across
26 test files (same pre-existing unrelated `journeySession.test.ts` file
issue persists; not a Phase 4 regression).

Gate met:
- List → detail navigation works via the existing `<Link to="/admin/
  enrollments/:eventPageId">` in the Phase 3 list; the detail route now
  renders the real component.
- Summary strip rendering is driven by `deriveSummary` on the live
  enrollments list.
- Deep-link into `/admin/event-pages?edit=<id>` opens the editor in edit
  mode; the param is consumed once and cleared.
- No Phase 5 row actions wired — the ⋯ button is disabled with a
  "coming in Phase 5" tooltip. No PATCH / POST / transfer endpoints
  added on the backend.
- Manual browser verification remains an admin-side step; unit and
  type-checks verify correctness, not visual polish.

### Phase 5A — Backend action endpoints — **implemented 2026-04-22**

Split from Phase 5 into a backend-first sub-phase. Delivered:

- Shared rules moved to module-level constants and helpers in
  `apps/admin-backend/app/routers/enrollments/enrollments.py`:
  `_TERMINAL_STATES`, `_LEGAL_TRANSITIONS`, `_is_legal_transition`,
  `_is_terminal`, `_normalize_optional_text`, `_has_contact`,
  `_iso_now` (plus the existing `_CANCELLED_STATES`,
  `_get_event_capacity`, `_count_active_enrollments`).
- `PATCH /admin/enrollments/{event_id}/{enrollment_id}/status` —
  validates existence; enforces legal-transition table (same-state is an
  idempotent no-op that does not bump `updatedAt`); illegal transitions
  return 409. Touches `updatedAt` + catalog.version only when state
  changes.
- `PATCH /admin/enrollments/{event_id}/{enrollment_id}/payment` —
  two-state toggle (`unpaid ↔ paid`). Same-state is idempotent.
- `PATCH /admin/enrollments/{event_id}/{enrollment_id}` — partial
  contact update. Uses `model_fields_set` to distinguish "field absent"
  from "field present with null"; normalizes whitespace; rejects 422
  when the result leaves no email AND no phone, or when `fullName` is
  cleared to empty.
- `POST /admin/enrollments/{event_id}` — admin manual create. Sets
  `createdBy='admin'`, `createdAt=updatedAt=now`. Status defaults to
  `pending`; paymentStatus mirrors the public rule
  (`unpaid` for paid events, `paid` for free). Rejects 409 at
  capacity — no override.
- `POST /admin/enrollments/{event_id}/{enrollment_id}/transfer` —
  remove-from-source + create-in-destination inside a single
  `event_page_repo.session()` so no partial state is committed.
  Rejects 400 if source == destination; 404 for unknown source event,
  enrollment, or destination event; 409 if source is terminal; 409 if
  destination is at capacity. Destination enrollment gets a new
  `id`, `createdBy='admin'`, fresh timestamps; `fullName` / `email` /
  `phone` / `note` / `status` / `paymentStatus` / `stripeSessionId`
  preserved from source. Returns `{ sourceEventPageId,
  sourceEnrollmentId, destinationEventPageId, destinationEnrollmentId,
  enrollment }`.
- Pydantic request models: `StatusUpdateRequest`, `PaymentUpdateRequest`,
  `ContactUpdateRequest`, `AdminCreateEnrollmentRequest`,
  `TransferRequest` — all `extra='forbid'`; `AdminCreateEnrollmentRequest`
  has an after-validator enforcing "email OR phone".
- No new storage, no global enrollments table — all mutations operate
  on `EventPageData.enrollments` through `event_page_repo.session()`.
- Tests:
  - `tests/test_enrollments_actions_api.py` — 28 integration tests
    across all five endpoints, including: legal / illegal / terminal /
    idempotent status transitions, payment toggle, partial contact
    update (clear email when phone present), rejection when both contacts
    cleared, empty-name rejection, admin create with email / phone /
    both / neither, explicit status+paymentStatus overrides, capacity
    rejection on admin create, transfer success with data preservation,
    same-source-and-destination rejection, destination-full rejection
    with source preserved, terminal-source rejection, unknown event /
    unknown enrollment 404 paths for every mutation.
  - `tests/conftest.py` seeds eight Phase-5A-specific events
    (`p5status`, `p5pay`, `p5contact`, `p5create`, `p5createfull`,
    `p5trsrc`, `p5trdst`, `p5trfull`) to avoid ordering collisions with
    earlier phases.

Verification: backend `pytest` — 73/73 pass (28 new + 45 from Phase 4);
frontend unchanged (no UI work in Phase 5A).

### Phase 5B — Admin actions UI — **implemented 2026-04-22**

**Outcome**: admin can drive the Phase 5A endpoints from the detail-view
row menu and new modals. Backend business rules untouched.

Delivered:
- API client extensions (`enrollmentsAdminApi.ts`):
  `patchEnrollmentStatus`, `patchEnrollmentPayment`,
  `patchEnrollmentContact`, `createAdminEnrollment`,
  `transferEnrollment`. Typed `AdminActionError { status, kind, message }`
  classifies HTTP responses into
  `not_found | conflict | validation | server | network` so UI can branch
  cleanly. JSON detail extraction mirrors the Phase 2 enroll client.
- Pure helpers:
  - `actionRules.ts` — `legalNextStatuses`, `isTerminalStatus`,
    `canTransfer`, `humanEnrollmentStatus` (frontend mirror of the Phase 5A
    backend transition graph; backend remains the source of truth).
  - `formValidation.ts` — `evaluateContactFormInput`,
    `evaluateManualCreateInput`, `diffContactPatch` (sends only fields the
    admin actually touched, including explicit `null` to clear).
- UI components in `features/admin/enrollments/ui/`:
  - `ActionModal.tsx` — minimal feature-local modal primitive (backdrop
    + card, Esc + click-outside dismiss, busy-lock to prevent
    dismiss-mid-request).
  - `RowActionsMenu.tsx` — compact popover. Surfaces only legal next
    statuses (terminal enrollments see a "status is terminal — no further
    changes" hint and a disabled Transfer item). Payment toggle shows
    "Mark as paid" / "Mark as unpaid" based on current state. Escape or
    outside-click closes.
  - `ContactEditModal.tsx` — fullName / email / phone / note; validates
    "email OR phone" resulting contact; `diffContactPatch` sends the
    minimal PATCH body; shows server 422 messages inline.
  - `ManualCreateModal.tsx` — header-launched "Add enrollment"; fields
    including optional status/payment selects (backend defaults apply
    when empty). Converts 409 capacity response into "This event is
    full." copy.
  - `TransferModal.tsx` — upcoming-events picker via Phase 3
    `fetchEnrollmentsOverview` + `partitionAndSort`; excludes the source
    event; disables destinations at capacity with a "full" badge; posts
    the transfer and refetches detail on success.
- Detail page wiring (`AdminEnrollmentsDetail.tsx`):
  - Replaced the Phase 4 disabled ⋯ placeholder with `RowActionsMenu`.
  - Header gained `+ Add enrollment` primary button (alongside the
    existing Event Page editor deep link).
  - Modal state machine (`none | create | editContact | transfer`) with
    a single render point per kind.
  - Action flow: on success, full `fetchEnrollmentsDetail` refetch (no
    optimistic UI — simple and correct for MVP).
  - Row-level `inFlight` dims + disables pointer events on the row being
    mutated.
  - Dedicated action-error banner (dismissable) separate from the
    detail-load error state.
- CSS additions (`AdminEnrollmentsDetail.css`): popover menu styling,
  header-action row, busy-row dim, modal backdrop + form styling, picker
  list styling, selected / disabled / full picker states. All additive —
  existing Phase 4 selectors untouched.

Tests (34 new; 506 → 540 total):
- `__tests__/actionRules.test.ts` — 9 tests: transition graph for
  pending / confirmed, terminal states have no outbound edges, terminal
  identification, transfer eligibility, human-label coverage.
- `__tests__/formValidation.test.ts` — 14 tests: contact-form
  acceptance matrix (name / email / phone / note combinations, empty-
  name rejection, clearing both contacts rejected), `diffContactPatch`
  (only-changed-fields semantics, null for cleared fields), manual-
  create acceptance matrix (email / phone / both / neither, malformed
  email, empty name).
- `__tests__/enrollmentsAdminApi.test.ts` — 11 new tests for the
  action clients (status/payment/contact/create/transfer) covering
  request shape (URL, method, body), success parsing, 409 → conflict,
  422 → validation, fetch-throw → network. Plus existing 4 tests from
  Phase 4.

Verification: backend `pytest` unchanged at 73 passed (no backend work
in Phase 5B); frontend `tsc --noEmit` clean; frontend `vitest` —
540/540 pass (same pre-existing unrelated `journeySession.test.ts` file
issue persists). No backend business-rule changes — the Phase 5A
endpoints are driving all UI flows.

Gate met:
- Row menu replaces the Phase 4 placeholder; actions surface only legal
  transitions.
- Each action (status change, payment toggle, contact edit, manual
  create, transfer) lands at the Phase 5A endpoint, on success triggers
  a detail refetch, on error displays a concise message matching the
  kind.
- Transfer picker lists only upcoming events excluding the source;
  destinations at capacity are disabled with a visible "full" badge.
- Manual browser verification remains for the admin-side review.

### Post-QA fixes — 2026-04-22

Three issues surfaced during manual admin QA and were fixed without
altering backend scope:

1. **Enrollments Detail ↔ Event Page editor return path.** The deep-link
   query now carries `&returnTo=/admin/enrollments/<id>` alongside
   `?edit=<id>`. The editor bootstrap stores the return path in a ref
   (`returnOnExitRef`), strips both params via `history.replaceState`,
   and `back()` navigates to the return path when the user exits edit
   mode. The path is validated (`startsWith('/admin/')`) to prevent
   open-redirect. Journey-authored flows are unaffected — only the
   no-ticket deep-link branch consults `returnTo`.
2. **Row actions menu clipping.** `RowActionsMenu` now renders via
   `createPortal(..., document.body)`. Position is computed from the
   trigger's `getBoundingClientRect()` on open, clamped to the viewport
   horizontally; the panel uses `position: fixed`. Scroll / resize
   close the menu so a stale anchor never leaves the panel misaligned.
   The roster table's `overflow-x: auto` no longer clips the dropdown.
3. **Top-level admin nav entry.** Added an "Enrollments" `GuardedNavLink`
   between Events and Media in `AdminHeader.tsx`. Matches the existing
   nav convention; dashboard tile remains.

Verification: `tsc --noEmit` clean; `vitest` 540/540 pass (unchanged);
backend unchanged at 73/73.

Backend endpoints (all under `/admin/enrollments`, auth-gated):
- `PATCH /:eventPageId/:enrollmentId/status` — body: `{ status }`.
- `PATCH /:eventPageId/:enrollmentId/payment` — body: `{ paymentStatus }`.
- `PATCH /:eventPageId/:enrollmentId` — body: any of
  `{ fullName?, email?, phone?, note? }`. Re-validates "email OR phone".
- `POST /:eventPageId` — manual create. Body: `{ fullName, email?, phone?,
  note?, status?, paymentStatus? }`. Sets `createdBy = 'admin'`. Rejects
  with 409 when the event is at capacity (no override).
- `POST /:eventPageId/:enrollmentId/transfer` — body: `{ toEventPageId }`.
  Implementation: remove from source + create in destination within a single
  repo session. Rejects with 409 if the destination is at capacity; rejects
  with 409 if the source enrollment is in a terminal state.

Frontend:
- Row ⋮ menu: change status · toggle payment · edit contact · cancel ·
  transfer.
- Edit contact modal.
- Manual-create modal launched from the detail header.
- Transfer modal with an event picker (upcoming events only, same filter
  semantics as the list page).
- Optimistic UI where safe; snackbar on success / error.

Gate: round-trip each action against a live seeded event; refresh and
confirm state persisted in `event_pages/catalog.json`; capacity limits hold
for both public and admin creates.

---

## 3. Data structures (lightweight)

### Event (relevant fields only — no new fields on `EventPageData`)

```
EventPageData {
  id: string
  slug: string
  preset: 'workshop' | 'pleinAir' | 'exhibition' | 'minimal'
  status: 'draft' | 'scheduled' | 'closed'
  title: Localized
  dateStart?: string                 // ISO; used for upcoming/past filter
  ctaAction?: {
    kind: 'register'
    paid: boolean
    capacity?: number                // source of truth for capacity limit
  } | ...
  price?: Money
  enrollments: Record<string, Enrollment>
}
```

The backend field stays named `enrollments` (no rename). Admin UI calls them
"Enrollments" in copy.

### Enrollment

```
type EnrollmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_user'
  | 'cancelled_by_admin'
  | 'no_show'
  | 'attended'

type PaymentStatus = 'unpaid' | 'paid'

Enrollment {
  id: string                         // "enr-YYYYMMDD-{base32(6)}"
  fullName: string
  email?: string                     // email OR phone required
  phone?: string
  note?: string
  status: EnrollmentStatus           // default: 'pending'
  paymentStatus: PaymentStatus       // default: 'unpaid' (paid for free events)
  createdBy: 'public' | 'admin'
  createdAt: string                  // ISO
  updatedAt: string                  // ISO
  stripeSessionId?: string           // optional; preserved for Stripe path
}
```

### Status model — justification

The earlier draft listed eight states including `new`, `pending`, and
`awaiting_payment`. On review:

- **`new` vs `pending` is a weak distinction.** Both mean "created, admin
  has not acted." MVP has no triage inbox / assignment semantics to
  differentiate them. Dropped `new`; use `pending` as the single initial
  state (the conventional term).
- **`awaiting_payment` is derivable.** With orthogonal `paymentStatus`, the
  state "event is paid and payment not yet received" is exactly
  `paymentStatus === 'unpaid' && event.price && status !== cancelled_*`.
  Rendering this as a derived label ("Awaiting payment") in the UI avoids
  storing a third dimension that restates the payment field. Dropped from
  the enum.

The remaining six states each describe a distinct admin-meaningful process
outcome; none of the remaining pairs overlap.

Legal status transitions (server-enforced):

```
pending → confirmed | cancelled_by_user | cancelled_by_admin
confirmed → attended | no_show | cancelled_by_admin
cancelled_* → (terminal)
attended | no_show → (terminal)
```

Transitions outside the table return 409 from the PATCH endpoint. UI offers
only legal next states in the status dropdown.

Payment transitions: one-way `unpaid → paid`; admin may revert
`paid → unpaid` for corrections. Stripe webhook is the only automatic writer
to `paid`.

---

## 4. UI/UX flow (high-level)

### Public user — enrollment

```
/event/:id  →  click CTA  →  modal form
  fields: fullName, email?, phone?, note?, consent
  validation: email OR phone required; consent required
  submit:
    free event       →  "Enrolled" confirmation screen
    paid event       →  Stripe redirect (handled by sibling CTA plan)
    capacity full    →  inline error: "This event is full."
```

### Admin — operational flow

```
/admin  →  "Enrollments" tile  →  /admin/enrollments
  filter: [Upcoming] [Past] [All]
  row:    date · title · X/Y enrolled · P paid · event status
  click →  /admin/enrollments/:eventPageId
    header: title · date · event status · [Open in Event Page editor ↗]
    summary strip: enrolled/capacity · paid/total · cancelled
    actions (header): [+ Add enrollment]
    table rows: name · contact · status · payment · createdAt · ⋮
      ⋮ menu: Change status · Toggle payment · Edit contact · Cancel · Transfer
```

Filter semantics:
- **Upcoming**: `dateStart >= today` OR `dateStart` missing (missing dates
  are treated as upcoming to surface for triage).
- **Past**: `dateStart < today`.
- Default tab: Upcoming.

Deep link from Event Page Editor (reverse direction): a small "Enrollments"
button on the edit screen navigates to `/admin/enrollments/:eventPageId`.
This replaces the embedded sidebar tab proposed by
`plan--events--cta-registration-system.md` §4.1.

---

## 5. Edge cases

- **Capacity reached (public)**: 409 response, inline error on the form.
- **Capacity reached (admin manual create)**: 409 response, modal surfaces a
  clear error. No "create anyway" override in MVP.
- **Duplicate submissions**: no hard uniqueness, but block the same
  (eventId, email-or-phone) within a 60-second window at the public
  endpoint to absorb double-clicks. Admin manual create is exempt.
- **Partial / abandoned paid enrollment**: the public form creates the
  record on submit. A paid-event user who abandons Stripe keeps
  `status = pending, paymentStatus = unpaid` — displayed with a derived
  "Awaiting payment" label. Admin can cancel or leave.
- **Transfer**: destination capacity is checked at transfer time; if full,
  transfer is rejected. Source enrollment is preserved until the
  destination write succeeds (single repo session). Transferring a
  cancelled or terminal-state enrollment is rejected at the endpoint.
- **Admin status override**: admin can move an enrollment to any legal next
  state per the transition table; terminal states still block further
  moves.
- **Missing contact**: backend rejects (email OR phone required). Admin edit
  cannot save an enrollment with neither.
- **Event deletion with enrollments**: out of MVP behavior change; block
  deletion at the Event Page Editor for events with any non-cancelled
  enrollment. Message: "Cancel enrollments first."
- **Clock skew for upcoming/past**: server time for the aggregate; client
  time for the filter label. Same-day events count as upcoming.
- **Missing `dateStart`**: treat as upcoming; show a warning badge so the
  admin fills it in.
- **Stripe webhook arrives for a cancelled enrollment**: ignore the payment
  update — the local record is terminal. Log for reconciliation. Narrow
  race window; acceptable for MVP.

---

## 6. Technical risks and tradeoffs

### JSON vault constraints

- `event_pages/catalog.json` holds all enrollments across all events. Per
  `plan--events--cta-registration-system.md` §6.4, the split tripwire is
  `> 200 enrollments per event` or `> 2 MB total`. MVP volume is well
  below.
- All writes go through `event_page_repo.session()` which uses an
  in-process `asyncio.Lock`. Multi-process deployments would race; matches
  the project's `decision--data--json-vault-no-database.md` single-operator
  assumption.
- `EventPageRepo` does not currently enforce optimistic concurrency (see
  `open_question--data--inconsistent-optimistic-concurrency.md`). Impact
  for admin actions is low at MVP scale; flag for future hardening if
  concurrent admin editing becomes real.

### Status model evolution

- The `EnrollmentStatus` enum is additive; legacy records lacking the field
  default to `pending`. Introducing new states later is a pure enum
  extension.
- Payment simplification `unpaid | paid` diverges from the current
  `pending | paid | failed`. The webhook handler must be updated so
  success yields `status = confirmed, paymentStatus = paid`; non-success
  leaves `unpaid`. The removed `failed` becomes a note on the enrollment or
  is tracked only in Stripe (MVP: Stripe dashboard is the authority for
  failure).

### Boundary with future user/contact catalog

The MVP treats each enrollment as a standalone record scoped to its event.
No cross-event identity is tracked. This is a deliberate MVP ceiling; the
forward-looking design concern is captured in
`open_question--architecture--user-contact-catalog.md` (added alongside
this plan) and is explicitly **out of scope** for MVP implementation.

### Transfer semantics

- Transfer is implemented as `remove source + create destination` in the
  same repo session. Failure of either step leaves no partial state (the
  session commit is atomic). This preserves the "one enrollment belongs to
  one event" rule with no relational reassignment.
- Transferred enrollments retain their contact data but receive a new
  `id`. This means an admin cannot later audit "this was transferred from
  event X" without checking the source (which is gone). For MVP, that
  tradeoff is accepted; a future user/contact catalog would capture the
  link naturally.

### Future-proofing against scope creep

- No waitlist today; if needed, add a `waitlisted` status and an overflow
  path — do not build infrastructure preemptively.
- No audit log today. `updatedAt` is the single pivot if history is later
  required; a full log would be a sibling `vault/json/enrollment_events/`.
- No multi-occurrence parent event. If "same workshop, multiple dates"
  emerges as a UI grouping need, represent it via a shared slug prefix or
  a `series` tag on EventPage — preserving the "exactly one event entity"
  invariant.

---

## 7. Out of scope (explicit)

- Stripe, webhooks, payment flow internals — owned by
  `plan--events--cta-registration-system.md`.
- Email notifications to owner/participant — owned by the CTA plan.
- Analytics events — owned by the CTA plan.
- Audit history / change log for enrollments.
- Participant login / self-service cancellation portal.
- Discount codes, group enrollment, multi-tier pricing.
- ICS calendar export.
- Waitlist.
- Capacity override ("create anyway") on admin manual create.
- Multi-day events, course bundles, date ranges.
- Global enrollments view across all events.
- **User / contact catalog. Identity merging. Cross-event participant
  history.** Tracked in
  `open_question--architecture--user-contact-catalog.md`. Do not design
  around it; do not introduce precursor abstractions.

---

## Open decisions (resolve as work starts)

- **Deep-link integration** from enrollments detail → Event Page editor:
  query-param bootstrap vs Journey ticket. Recommendation: query param,
  simpler.
- **Contact edit UX**: dedicated modal vs inline row editing.
  Recommendation: modal for consistency with Stream / Event Page editor
  patterns.
- **Transfer picker scope**: upcoming events only (default), or all events.
  Recommendation: upcoming only; allow a toggle if admins request past.

---

## Related

- `decision--event--event-page-is-canonical-event.md` — single canonical event
- `invariant--architecture--single-event-entity.md` — enforcement
- `decision--data--json-vault-no-database.md` — storage substrate
- `architecture--editor--event-system.md` — where `/admin/event-pages` lives
- `spec--editor--event-system-behavior.md` — CTA + status semantics
- `plan--events--cta-registration-system.md` — sibling plan (public/payment/
  analytics/notifications); admin-UI shape reconciled here
- `open_question--data--inconsistent-optimistic-concurrency.md` — latent risk
  for admin-write concurrency
- `open_question--architecture--user-contact-catalog.md` — deferred
  architectural concern (future direction, out of MVP scope)
