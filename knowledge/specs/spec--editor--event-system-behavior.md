---
type: spec
scope: [editor]
status: active
date: 2026-04-21
source_of_truth: false
tags: [event, behavior]
---

# Event Editor behavior

Canonical editor: `EventPageEditor`. Manages `EventPageData`. The legacy dual-editor split was retired by `decision--event--event-page-is-canonical-event.md`; this spec describes only the surviving editor.

## Media picker integration

Uses module-level `_pendingMediaField` to survive component unmount during picker journey:

1. `pickMedia(targetField)` → save `_pendingMediaField`, persist draft, dispatch to media editor
2. Media editor returns with loot
3. Bootstrap restores draft, applies `draft[targetField] = loot.id`
4. Draft cleanup is intentionally skipped when `_pendingMediaField` is set

## Factory creation

`createEventPage(preset)` produces new `EventPageData` with preset defaults.
Mode stack transitions: `['select', 'create']` → `['select', 'edit']` (create replaced by edit).

## Preview

Push `'preview'` onto mode stack from edit. Pop returns to edit. Preview renders current draft (including unsaved changes).

## Publication status (Settings section)

`SettingsSection` exposes `status` as an editable select (`draft` / `scheduled`). The value flows through the generic `setDraftField('status', value)` path and is included in the save payload verbatim — no special wiring. Semantics:

- `draft` → visible only in admin/preview (admin endpoint `/api/admin/event-pages` returns unfiltered; `/preview/event/:id` and the preview homepage consume it).
- `scheduled` → visible on public surfaces (public endpoint `/api/public/event-pages` filters by `status === 'scheduled'`; homepage, `/event/:id`).

Legacy statuses outside this pair (e.g. `closed`) render as a fallback option so existing records are not silently mutated on open.

## CTA action

`CtaSection` configures a `CtaAction` discriminated union attached to `EventPageData`:

- `{ kind: 'external', url }` — opens URL in a new tab (`_blank` + `noopener,noreferrer`).
- `{ kind: 'register', paid, capacity? }` — opens the registration modal. Gated by `status === 'scheduled'`. Capacity input captured; enforcement scheduled for a later phase.
- `{ kind: 'inquiry', toEmail? }` — Phase-1 stub: `alert('Coming soon')`. Real flow lands later.

Runtime dispatch lives in `pages/public/EventPage.tsx` and emits `trackCtaClick` on click (suppressed in preview). Editor preview (`EventPageEditor.tsx handlePreviewCta`) mirrors the same dispatch so authors see configured behavior before saving.

Legacy records without `ctaAction` are handled by `resolveCtaAction(page)` which infers `{ kind: 'register', paid: (price.amount > 0) }`. No migration is performed — inference is read-time only.

### `eventId` field — deprecated

`EventPageData.eventId` is **deprecated**. Before the EventPage canonicalization (2026-04-21) it pointed at a separate `EventData` record; post-canonicalization the event is the page itself, enrollments persist on the page record, and the field is not consulted by the canonical enrollment flow. The field is retained in the schema for one cycle to tolerate records authored under the old assumption.

The register CTA gate is now **status-only** (`status === 'scheduled'`). The previously surfaced "Linked Event ID" input was removed from `CtaSection` in the frontend reconciliation phase of the migration (`plan--event--collapse-into-event-page.md` Phase 3, 2026-04-21). `SettingsSection` retains the input with a "legacy — not used by registration" hint so historical values remain inspectable and editable for compatibility, but editing it has no effect on the enrollment target. Removal of the field entirely is planned for a later cycle.

## Related

- `architecture--editor--event-system.md`
- `decision--event--event-page-is-canonical-event.md`
- `invariant--architecture--single-event-entity.md`
- `plan--event--collapse-into-event-page.md`
