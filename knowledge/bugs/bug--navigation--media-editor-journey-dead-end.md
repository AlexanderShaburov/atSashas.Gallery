---
type: bug
scope: [navigation, admin, media-editor]
status: fixed
date: 2026-04-23
fixed_date: 2026-04-23
source_of_truth: true
tags: [journey, media-editor, ux, dead-end, cancel, escape]
---

# Media Editor dead-end when arrived via event-editor media picker

## Symptom

Flow: event create → open a gallery → click "From Media" to pick media
for a slot. Admin lands on the Media Editor. No Back / Exit / Cancel
button is visible, and pressing Escape does nothing. Admin has no
explicit way back to the event editor.

## Root cause

`MediaEditor.tsx` gated both the Cancel button **and** the Escape
handler on `screenMode === 'pick'`:

- Cancel button rendered inside `<MediaPickMode>` only.
- Escape keydown listener registered inside `<MediaPickMode>`'s
  `useEffect` only.

So the moment `screenMode` is anything other than `'pick'` — `'select'`,
`'edit'`, `'create'` — the admin has no explicit way back even when a
journey is actively in flight.

There are legitimate production paths where that condition is met:

- The bootstrap sees `ticket.destination.mode === 'select'` with no
  loot and sets `screenMode = 'pick'` — the happy case.
- But any bootstrap fallback path (ticket arrives after
  `processHopperReturn` populates a create draft, or a bootstrap
  ordering race on a slow network, or a direct nav during an active
  journey via `GuardedNavLink`) leaves `screenMode = 'select'` while
  `isJourney` is still true. The journey is alive but the UI offers
  no way out.

The fix below makes the Cancel affordance and Escape handler
conditional on `isJourney` rather than `screenMode`, so they are
always present when a journey is in flight regardless of which screen
the MediaEditor happened to render.

## Fix

`apps/frontend/src/features/admin/mediaEditor/ui/MediaEditor.tsx`:

1. **Escape handler lifted to the container.** Now attached at
   `MediaEditor` (top-level) and fires whenever `isJourney` is true.
   Every child screen inherits it.
2. **Cancel button in `MediaSelectMode` when `isJourney` is true.**
   Renders next to "Upload New" in the header, reusing the existing
   `media-edit-form__back` button class for consistency.
3. **Header title adapts** to "Pick a media item" when the select
   screen is being used in a journey, mirroring the pick-mode title
   so the admin sees a clear "you are picking" framing.

No changes to the session / journey protocol. `cancelPick` already
correctly gates on `isJourney` and calls `returnHome('mediaItems',
{ ok: false, reason: 'cancel' })`.

## Why the bug matched the described UX exactly

The user sees no Cancel button because `MediaSelectMode` (the fallback
screen) does not render one. They press Escape and nothing happens
because the Escape listener only runs inside `MediaPickMode`'s
`useEffect`. The journey is still active — `isJourney` is true — but
every visible affordance for returning is hidden behind a screen-mode
conditional the admin can't influence.

## Verification

- `tsc --noEmit` clean.
- `vitest run src/features/admin/mediaEditor` — 85 / 85 pass (no
  existing behavior regression).
- Manual: the pick-mode happy path is unchanged (same Cancel button,
  same Escape → returnHome). The new defensive path adds a Cancel +
  Escape affordance whenever `isJourney` is true, irrespective of
  screen mode.

## Generalizable pattern

**Dead-end = journey active AND no return affordance rendered.** Any
editor that participates in Journey should key its "get me out of
this journey" control on `isJourney`, never on its own transient
`screenMode`. Screen mode is a UI state the editor can drift through
during bootstrap; the journey state is the stable contract with the
caller.

Apply the same rule to other editors that currently gate their
Cancel / Exit on an internal mode (search the codebase for
`screenMode === 'pick'` or equivalent conditionals controlling
Journey exits).

## Related

- `invariant--navigation--all-cross-editor-flows-use-journey.md` —
  the enforcement contract this bug slipped past
- `architecture--navigation--journey-system.md` — the Journey
  protocol the MediaEditor participates in
- `architecture--editor--media-editor.md` — the modes described in
  this fix
