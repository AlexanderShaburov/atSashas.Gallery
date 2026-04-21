---
type: plan
scope: [event, data, system]
status: proposed
date: 2026-04-19
source_of_truth: false
tags: [cta, registration, payments, analytics, notifications, mvp]
---

# CTA & Event Registration System — Execution Plan

## Intent

Move event pages from static UI to a working interaction system: CTA buttons perform real actions, registrations are captured and persisted, paid events flow through payment, the event owner sees participants in the editor, and minimal analytics track funnel drop-off.

---

## 1. System decomposition

Six subsystems, each with a single responsibility and a clear owner layer:

1. **CTA Model** (`entities/event` + `entities/common`)
   - Declarative `CtaAction` config attached to `EventPageData`. Runtime reads it; editor writes it. No behavior in the entity.
2. **Registration System** (backend JSON repo + `features/public/registration` UI)
   - Captures form submissions, persists as `Registration` records, exposes admin listing.
3. **Payment Flow** (backend Stripe client + webhook + `features/public/registration/payment` redirect)
   - Stripe Checkout redirect for paid registrations. Webhook is the only state authority; UI reflects, never asserts.
4. **Event Editor Extensions** (`features/admin/eventPageEditor`)
   - New "CTA" sub-section on the editor sidebar (configure CTA action/pricing/capacity). New "Registrations" sidebar tab inside the edit mode (list/filter/export).
5. **Analytics Tracking** (`shared/analytics` + backend ingest endpoint)
   - Thin event-emission layer with fixed vocabulary. Server writes append-only log.
6. **Notifications** (backend mailer)
   - Owner email on `registration.created` and `payment.succeeded`. Template-based. No in-app inbox for MVP.

Boundary rules (respect existing invariants):

- Registration is NOT a new domain entity for the purposes of ADR §3.1 — it is a sub-record of **Event** (like enrollments today, formalized). This sidesteps the "adding a domain entity requires ADR" invariant. Analytics events are operational, not domain-level.
- Payment state lives on the Registration record; the payment provider (Stripe) is the source of truth for *transaction* state, Registration is the source of truth for *local* state synchronized from webhooks.
- Editor vs runtime separation: the editor writes CTA config; the public runtime reads it. Zero shared mutable state. Registrations written by runtime are read (never written) by the editor.

---

## 2. Data models

### 2.1 CtaAction (config — attached to EventPageData)

```
CtaAction =
  | { kind: 'external', url: string }
  | { kind: 'register', paid: boolean, capacity?: number }
  | { kind: 'inquiry',  toEmail?: string }
```

- `ctaLabel: Localized` stays on EventPageData (already present; controls button copy).
- `price?: Money` stays on EventPageData (already present; used when `paid: true`).
- `cancellationNote?: Localized` stays (already present).
- Add: `ctaAction: CtaAction` on EventPageData. Default `{ kind: 'register', paid: false }` for workshop/pleinAir presets; `{ kind: 'register', paid: false }` for exhibition (RSVP); minimal preset default TBD during Phase 1.
- Legacy migration: records without `ctaAction` treated as `register, paid: (price exists)`.

### 2.2 Registration (sub-record of Event)

> **Note (2026-04-21)**: pre-migration this document referenced a separate `EventData` entity. That split was retired by `decision--event--event-page-is-canonical-event.md`. In the canonical model the Event *is* the EventPage: `eventPageId` is the only reference form, and registrations live at `event_pages/catalog.json > pages[eventPageId].registrations`.

```
Registration = {
  id: string              // "reg-YYYYMMDD-{base32(6)}"
  eventPageId: string     // → EventPageData.id (the canonical event)
  fullName: string
  email: string
  phone?: string
  note?: string           // free-form, from form field
  paymentStatus:
    | 'free'      // registration is for a free event — no payment expected
    | 'pending'   // Stripe session created, awaiting webhook
    | 'paid'      // webhook confirmed
    | 'failed'    // webhook reported failure
    | 'refunded'  // admin-initiated or webhook-reported
    | 'cancelled' // user abandoned or admin cancelled
  amountPaid?: Money      // set on 'paid', from Stripe
  stripeSessionId?: string
  stripePaymentIntentId?: string
  createdAt: ISODate
  updatedAt: ISODate
  source?: string         // 'web', 'preview', etc. — analytics correlation
  consent: { acceptedTerms: true, at: ISODate }  // GDPR record
}
```

Storage: `vault/json/event_pages/catalog.json > pages[eventPageId].registrations: Record<regId, Registration>`.

Rename from existing `enrollments` to `registrations` for clarity. Keep a read-side alias in the backend Pydantic model for one release cycle to avoid breaking any existing consumer, then retire.

Rationale: a separate file would add complexity (cross-file joins) without a real benefit at MVP scale. JSON vault decision (`decision--data--json-vault-no-database.md`) already commits to files-as-truth; this fits.

### 2.3 Payment state

No separate entity. Payment state is a set of fields on Registration (`paymentStatus`, `amountPaid`, `stripeSessionId`, `stripePaymentIntentId`). The Stripe dashboard is the external source of truth for transactions; our record is a local reflection maintained by webhook.

Lifecycle transitions (server-enforced, single direction except refund):

```
initial creation:
  free event       → 'free'
  paid event       → 'pending' (Stripe session created)

webhook events:
  checkout.session.completed (paid)   → 'paid'
  checkout.session.expired             → 'cancelled'
  payment_intent.payment_failed        → 'failed'
  charge.refunded                      → 'refunded'

admin:
  manual cancel (free)                 → 'cancelled'
```

### 2.4 Analytics events

Single shape, fixed vocabulary (small enum):

```
AnalyticsEvent = {
  id: string                           // "ae-YYYYMMDD-{base32(8)}"
  at: ISODate
  sessionId: string                    // browser-generated, cookie-less, per-tab
  kind:
    | 'event_page_view'
    | 'cta_click'
    | 'form_open'
    | 'form_submit'
    | 'payment_started'
    | 'payment_succeeded'
  eventId?: string
  eventPageId?: string
  ctaKind?: CtaAction['kind']
  registrationId?: string              // for form_submit + payment_*
  meta?: Record<string, string>        // extensible, small
}
```

Storage: `vault/json/analytics/YYYY-MM-DD.jsonl` (append-only, one file per day). No external SaaS for MVP. Retention policy out of scope here.

Rationale: a fixed vocabulary prevents event sprawl. JSONL per day lets us roll up, compress, or archive without schema migration.

---

## 3. User flows

### 3.1 Free registration

1. User lands on `/event/:id`. Page view event emitted.
2. User clicks CTA (label from `ctaLabel`). `cta_click` event emitted with `ctaKind: 'register'`.
3. Registration form overlays the page (modal or inline — TBD Phase 2, modal preferred for focus). `form_open` event.
4. User fills `fullName` + `email` (+ optional `phone` + `note`) and a required consent checkbox.
5. Submit → POST `/api/public/events/:eventId/registrations`. `form_submit` event.
6. Backend creates `Registration` with `paymentStatus: 'free'`, returns confirmation.
7. UI shows success screen: "Registered — confirmation sent to your email".
8. Backend fires owner-notification email (non-blocking; failure does not reject registration).

### 3.2 Paid registration

1–5. Same as above, but form server knows `paid: true` and `price`.
6. Backend creates `Registration` with `paymentStatus: 'pending'`, creates Stripe Checkout Session with metadata `{ registrationId, eventId }`, returns `checkoutUrl`.
7. Client redirects to Stripe Checkout. `payment_started` event fired just before redirect.
8. On Stripe:
   - **Success** → Stripe redirects to `/event/:id?rt=ok&reg={id}`. Page shows "Payment received" (pending webhook confirmation if race). `payment_succeeded` emitted on arrival.
   - **Cancel/abandon** → Stripe redirects to `/event/:id?rt=cancel`. Page shows "Payment cancelled — registration was not completed".
9. Webhook (server-side, independent of user return) receives `checkout.session.completed` and moves Registration to `paid`, stores `amountPaid` + `paymentIntentId`. Fires owner email.
10. If webhook never arrives (Stripe timeout, app outage): a nightly reconcile job pulls unresolved `pending` records older than N hours and queries Stripe directly. **Deferred to post-MVP** — MVP accepts the webhook as trusted.

### 3.3 External CTA

1. User clicks CTA. `cta_click` with `ctaKind: 'external'`.
2. Browser opens `ctaAction.url` in a new tab.
3. No further tracking.

### 3.4 Inquiry CTA (optional, Phase 2+)

1. User clicks CTA. `cta_click` with `ctaKind: 'inquiry'`.
2. Modal with a contact form (fullName + email + message).
3. Submit → POST `/api/public/events/:eventId/inquiries` (or `mailto:` — decision deferred).
4. Backend emails owner. No persisted record for MVP.

---

## 4. Admin flows

### 4.1 Registrations list (Event Page Editor, new sidebar tab)

- New section in the editor sidebar: **Registrations** (alongside Content / Schedule / CTA / Media / Settings).
- Renders only in edit mode (not create).
- Columns: name, email, phone, paymentStatus, createdAt.
- Filters: status (all/free/pending/paid/failed/refunded/cancelled), text search by name/email.
- Sort: createdAt desc (default), paymentStatus.
- Aggregate strip at top: `N total | N paid | N pending | N free` + capacity fill bar if `capacity` set on CTA.
- Per-row actions (MVP): view full details (modal), mark-cancelled (free only). Refunds for paid registrations handled in Stripe dashboard; admin UI mirrors state post-webhook.
- Export: CSV download of current filter. (Phase 5.)

### 4.2 CTA configuration (new editor sub-section)

Currently the editor has a `CtaSection` for label/bridge text. Extend to configure `ctaAction`:
- Kind selector: External link / Registration / Inquiry.
- External: URL input.
- Registration: toggle "Paid?", capacity input. Price uses the existing top-level `price` field.
- Inquiry: (Phase 2) target email.

### 4.3 Analytics view

- New section in Event Page Editor: **Analytics** (or `/admin/analytics/:eventId`). MVP scope:
  - Funnel counts for this event: views → CTA clicks → form opens → form submits → payments started → payments succeeded.
  - 30-day window default, date-range picker.
- No dashboards across events in MVP.

### 4.4 Event Editor vs Event Page Editor responsibility split

- **Event Editor** (`EventData`) — owns the event record, pricing, status (draft/scheduled/closed), registrations.
- **Event Page Editor** (`EventPageData`) — owns presentation + CTA config. References `eventId` to target the event.
- Registrations list lives on the **Event Page Editor** UI (that's where the editor user is already focused), but reads from `EventData.registrations` via backend join.

---

## 5. Implementation phases

Each phase ends with a manually-testable artifact. No phase leaves a half-wired state.

### Phase 1 — Foundation (CTA model + Event Editor CTA config) — **implemented 2026-04-19**

Goal: the CTA on a public event page does what the config says (external link or nothing, but wired).

Deliverables (shipped):
- `CtaAction` discriminated union added to `entities/event/ctaAction.ts` with `resolveCtaAction(page)` for legacy inference.
- Editor: `CtaSection` now leads with Kind selector → conditional fields (external URL / paid + capacity / recipient email).
- Public runtime: `EventPage.tsx` dispatches on `ctaAction.kind`. `external` → `window.open(url, '_blank', 'noopener,noreferrer')`. `register` → existing `EnrollmentForm` modal, gated by `status === 'scheduled' && !!eventId`. `inquiry` → `alert('Coming soon')` stub.
- Preview parity: `EventPageEditor.handlePreviewCta` mirrors the runtime dispatch.
- Analytics: `shared/analytics/track.ts` with `trackCtaClick` (console-only, preview-suppressed). Vocabulary aligns with plan §2.4 for Phase 5.
- Backend: typed `CtaAction` union added to `apps/admin-backend/app/models/event_pages.py` with Pydantic discriminator. `extra="allow"` preserves round-trip for any remaining unknown fields.
- No migration performed — `resolveCtaAction` handles legacy records at read time.

Test outcome: 368 existing tests pass + 6 new unit tests on `resolveCtaAction` cover explicit-value, legacy-free-inference, legacy-paid-inference, and no-capacity-backfill cases.

### Phase 2 — Free registration end-to-end — **blocked 2026-04-21, migration-in-progress**

**Blocker**: manual QA surfaced that the admin UI has migrated to `EventPageEditor` as the only user-visible event editor, but the enrollment endpoint still reads from `events/catalog.json` (legacy EventData repo). See `knowledge/bugs/bug--event--id-prefix-collision-between-event-and-eventpage.md`.

**Ratified resolution**: `knowledge/decisions/decision--event--event-page-is-canonical-event.md` (EventPage is canonical; legacy retired).

**Unblock conditions**: Phase 3 (Frontend reconciliation) of `knowledge/plans/plan--event--collapse-into-event-page.md` completes. At that point the enrollment pipeline targets the canonical entity and this phase can resume. The Event picker design within this phase should be reviewed at that time — likely unnecessary once EventPage is the only event concept.


Goal: a user can register for a free event and the owner sees the registration.

Deliverables:
- Registration form modal on public page.
- Backend endpoint `POST /api/public/events/:eventId/registrations` → creates free registration.
- `Registration` record written to `events/catalog.json > events[id].registrations`.
- Rename `enrollments` → `registrations` in the data model + Pydantic read-alias.
- Registrations sidebar tab in Event Page Editor: list + basic filters + aggregate counts.
- Owner email on `registration.created` (existing SMTP stack or a simple mailgun/resend integration — decision Phase 2).

Test: register on a free event, see the entry in the editor's Registrations tab within seconds, receive owner email.

### Phase 3 — Paid registration + Stripe

Goal: paid events flow through Stripe, webhook updates state.

Deliverables:
- Backend Stripe client wrapper: create session, verify webhook.
- `POST /api/public/events/:eventId/registrations` branches: `paid: true` → create Stripe Checkout Session → return `checkoutUrl` with `sessionId`.
- Webhook route `/api/webhooks/stripe` → update `Registration.paymentStatus`.
- Public page handles Stripe return URLs (`?rt=ok` / `?rt=cancel`).
- Admin registrations list shows paymentStatus + amount.
- Owner email on `payment.succeeded`.
- Stripe test mode keys in dev; production keys post-QA.

Test: create a paid event, register, pay with Stripe test card, verify state moves pending → paid, owner gets email.

### Phase 4 — Editor integration polish

Goal: admin UX is usable day-to-day.

Deliverables:
- Aggregate counts (total / paid / pending / free) + capacity fill bar.
- Filter + search UI.
- Row details modal with full Registration record.
- Mark-cancelled action for free registrations.
- Empty and loading states.
- `capacity` enforcement on registration endpoint (reject when full; queue/waitlist deferred).

Test: scenario where 5 people register for a 3-seat workshop — the 4th gets rejected with a clear message.

### Phase 5 — Analytics

Goal: owner can see funnel drop-off per event.

Deliverables:
- Client `track(event)` helper with the fixed vocabulary.
- Backend `POST /api/analytics` accepting events, appending to daily JSONL.
- Instrument public pages: `event_page_view`, `cta_click`, `form_open`, `form_submit`, `payment_started`, `payment_succeeded`.
- Admin Analytics view with funnel counts + date range.
- CSV export of registrations.

Test: click through the user flow, then open the event's Analytics view, see correct step counts.

---

## 6. Technical risks

### 6.1 Data consistency

- **Race between Stripe return and webhook**. User returns to our success URL before the webhook fires. UI can show optimistic "received" state but must not let the owner contact the user as "paid" until webhook confirms. Mitigation: webhook is the only writer of `paymentStatus: 'paid'`; UI shows `pending` until then.
- **Lost webhook**. If the app is offline when Stripe fires, registrations stick in `pending`. Mitigation (post-MVP): reconcile job that queries Stripe for stale `pending` records nightly.
- **Double registration**. User double-clicks submit. Mitigation: idempotency key per form session; backend deduplicates on `(eventId, email, minute-bucket)`.
- **JSON file contention**. Concurrent writes to `events/catalog.json` can corrupt. Mitigation: file-lock or single-writer queue. If scale becomes real, consider per-event files (see §6.4 below).

### 6.2 UX drop-offs

- **Modal over-dark page**. Form opens over a dark backdrop; contrast must be high. Mitigation: follow footer/menu surface vocabulary.
- **Stripe redirect friction**. Users unfamiliar with Stripe may abandon. Mitigation: clear "You'll pay on Stripe's secure page" copy before redirect.
- **Email not arriving**. Spam classification on confirmation emails. Mitigation: SPF/DKIM setup; copy shows "Check spam, contact X if you don't see it".
- **Capacity race**. Two users hit submit simultaneously for the last seat. Mitigation: check + insert under the same file lock; reject second with explicit message.

### 6.3 Flow breakage

- **EventPageData has its own `enrollments`** (present in the type today). Duplicates the field on EventData. Pick one. Decision in this plan: registrations live on EventData, EventPageData references via `eventId`. Remove `enrollments` from EventPageData during Phase 2.
- **Webhook endpoint is public**. Must verify Stripe signature; reject unsigned posts.
- **CTA stub regression**. Phase 1 ships `register`/`inquiry` as stubs. Easy to forget to replace in Phase 2. Mitigation: add a visible TODO marker and an anti-regression test that asserts the form opens.

### 6.4 Scale tripwires

These are acceptable at MVP but should trigger action when crossed:

- `events/catalog.json` > 2 MB or > 200 registrations per event → migrate to per-event files.
- Analytics JSONL > 100 MB total → introduce rollup job.
- More than 10 paid events per month → reconcile job becomes mandatory.

---

## 7. Minimal MVP definition

### INCLUDED in MVP

- `CtaAction` model with three kinds: external / register / inquiry.
- Editor: CTA kind + external URL + paid toggle + capacity input.
- Public: working external CTA; working free registration form.
- Free registration persisted to EventData.
- Paid registration via Stripe Checkout + webhook updating state.
- Admin Registrations tab: list, basic filters, aggregate counts.
- Owner email on registration created + payment succeeded.
- Analytics vocabulary defined and emitted; admin read view.
- Capacity enforcement (reject when full).

### EXCLUDED from MVP (explicit)

- Waitlist / queue on full capacity.
- In-app user accounts / login for registrants.
- Discount codes, group registration, multi-tier pricing.
- Refunds from the admin UI (use Stripe dashboard; UI reflects post-webhook).
- Manual admin creation of registrations.
- ICS / calendar export for users.
- SMS notifications.
- Analytics dashboards spanning multiple events.
- CSV import of external registrations.
- Webhook reconcile job (ops-level redundancy; added when paid volume warrants).
- Stripe Elements embedded payment (redirect flow is simpler; embed is a later polish).
- Multi-currency (price already uses `Money` — currency displayed, single Stripe account currency for MVP).
- GDPR erasure request workflow (record consent; full erasure API is a later compliance task).

---

## Open decisions (to resolve as work starts)

- **Mailer**: Resend vs Mailgun vs SMTP (dev uses local SMTP; production TBD Phase 2).
- **Form placement**: modal vs inline vs new route. Preference: modal for focus + reversibility.
- **Stripe account**: production account setup separately from code; not blocking Phase 1–2.
- **Registrations file split**: keep in `events/catalog.json` for MVP; split when the §6.4 tripwire fires.
- **Analytics retention**: 90 days default, revisit at Phase 5 closure.

---

## Related

- `decision--data--json-vault-no-database.md`
- `architecture--data--domain-model.md`
- `architecture--editor--event-system.md`
- `spec--editor--event-system-behavior.md`
- `invariant--architecture--entities-are-finite-and-controlled.md`
- `open_question--event--event-page-tile-model.md` (adjacent; registrations may inform the tile model)
