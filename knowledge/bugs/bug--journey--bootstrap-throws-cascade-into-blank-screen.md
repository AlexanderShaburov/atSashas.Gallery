---
type: bug
scope: [navigation, journey, frontend]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [journey, bootstrap, cascade, blank-screen, error-handling]
---

# Editor-session bootstraps threw on unexpected ticket states, cascading into a blank screen and corrupted journey

## Symptom

Two distinct user reports, same underlying mechanism:

1. **Re-clicking an already-assigned slot image**:
   - Click → routes to `/admin/catalog`
   - Blank white screen with Catalog tab highlighted
   - Refresh → admin lands in Catalog Select Mode outside the journey
   - Browser back → console error
     `JourneySession: Arrival on unexpected editor block instead of catalog`

2. **Upload chain (Block → Catalog → Hopper → upload → return)**:
   - "Apply may become non-functional after uploading a new local file"
   - "Newly created art object may exist, but not get injected back into
     the originating editor"
   - "Journey can become inconsistent or stranded"

## Root cause

`CatalogEditorSession.context.tsx` and `BlockEditorSession.context.tsx`
each had a long chain of `throw new Error(...)` statements inside the
async IIFE that runs the bootstrap effect. Six throw points across the
two files covered conditions like:

- catalog edit-mode ticket without `objectId` → `throw`
- catalog edit-mode ticket whose `objectId` isn't in the catalog → `throw`
- catalog return ticket whose `returnTo.mode !== 'edit'` → `throw`
- catalog return without `loot` or with `loot.ok === false` → `throw`
- block return with unexpected `returnEffect.kind` → `throw`
- block return where the saved draft isn't in `editSessionsDataStore` → `throw`

Each throw inside the async IIFE became an unhandled promise rejection.
Since there's no error boundary around the editor surface, React halted
the editor render and showed a blank surface. **More importantly**: the
journey leg was never consumed, so it stayed in `outbound` state in the
session store. The next navigation (browser back, manual nav, or the
homepage tile) mounted a different editor whose `arrival(myKind)` saw
the stuck leg's `destination.editor !== myKind` → threw the
"Arrival on unexpected editor" error and cascaded the corruption.

The corruption was sticky: every subsequent admin-nav while the leg
remained re-tripped the same error.

## Fix

Replaced every bootstrap throw with a graceful fallback in both
sessions:

### `CatalogEditorSession.context.tsx`

- Outbound `edit` with missing `objectId` → log + `returnHome('catalog',
  {ok:false, reason:'error'})` + `setScreenMode('select')`. The leg
  completes cleanly so the next editor mounts without confusion.
- Outbound `edit` with `objectId` not in catalog → same. This is the
  exact path triggered by re-clicking a slot whose stored artId is
  stale (e.g., post-upload reconcile didn't fully land), which was the
  P1 reproducer.
- Outbound with unsupported `destination.mode` → same.
- Return ticket with `returnTo.mode !== 'edit'` → log + drop into
  `select` mode (no journey to abort, the leg already returned).
- Return without `loot` or with `loot.ok === false` (cancel/error) →
  log + `select` mode. The user's hopper-cancel path no longer crashes
  the catalog.

### `BlockEditorSession.context.tsx`

- Return with unexpected `returnEffect.kind` → log + `setModeStack(['select'])`.
- Return missing `blockId` on the effect → log + `select`.
- Return where `editSessionsDataStore` no longer has the block draft →
  log + `select`. Most likely cause: long upload chain that crossed a
  session reset; the user keeps any other in-flight work.
- Default branch on the `effect.kind` switch → log + `select` rather
  than `throw`.

In all cases the leg ends up consumed (no stuck `outbound`), the user
sees a usable editor (no blank screen), and any nav after the failure
operates on a clean session-store state (no "unexpected editor" cascade).

## Why this addresses both Priority 1 reports

For the **re-clicking assigned slot** path, the catalog bootstrap was
throwing on `if (!item)` when the slot's stored `artId` didn't match
any catalog entry — typically because a previous upload-create flow
left the slot pointing at an id the catalog didn't end up assigning.
The new graceful fallback completes the leg with `ok:false` and lets
the user keep working in the originating editor.

For the **upload chain break**, the most damaging symptom (apply
non-functional, journey stranded) was identical: a throw in one of the
bootstrap branches left the journey leg unconsumed, and every
subsequent action saw the corruption rather than the fresh state. With
all throws replaced by graceful returns, partial-failure paths still
fail (they have to — the data really was missing) but they no longer
poison the global journey store. The user sees a clear console error
and a usable editor, and can retry without reload.

The deeper data-flow questions (does the catalog correctly carry the
new artId back to the block? does `applyById` close the leg under all
shapes?) remain open — they will be investigated separately when the
user can repro on the deployed build with this hardening in place. The
hardening makes those investigations cheaper because the failures will
no longer cascade into "everything looks broken".

## Generalizable rule

**Editor-session bootstraps must never throw out of their async IIFE.**
Every bootstrap path that can fail with malformed ticket / missing
data / wrong state must `console.error` the diagnostic and fall through
to a sensible default mode (typically `select`). If the failure
happened during an outbound leg, also call `returnHome` with
`ok:false` to consume the leg cleanly.

A thrown bootstrap creates compound damage: it hides the original
error behind a blank screen AND leaves the journey session store in
an inconsistent state, so the *next* navigation produces a different
error that doesn't trace back to the root cause. This is the worst
possible failure mode for diagnosing user-reported bugs.

## Related

- `architecture--navigation--journey-system.md` — the journey protocol
  these bootstraps participate in
- `invariant--navigation--all-cross-editor-flows-use-journey.md` —
  every editor that participates must handle every ticket shape
  gracefully
- `bug--editor--eventpage-session-provider-render-warning.md` —
  related editor-session bootstrap issue from earlier in the
  migration cycle
- `bug--auth--silent-session-expiry-zombie-state.md` — sibling pattern
  where a silent failure mode (auth lost) masqueraded as random product
  bugs; same lesson applied (make implicit failure modes explicit)
