---
type: bug
scope: [navigation, journey, frontend, blocks]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [journey, block-editor, gallery, lifecycle, saved, click-handler]
---

# Re-clicking an already-assigned slot image on a saved gallery block did nothing

## Symptom

User reported (P1, after the journey-bootstrap-throw hardening landed):

> Case A — Existing block: If I open an already-created block and click an
> already-selected image, nothing happens. There is no visible journey
> into the catalog or edit mode.

The block in this case has `lifecycle === 'saved'` (loaded from the
collection). The expected behavior, per the comment in `BlockEditorSession.travel.ts`
itself, is:

> if saved → catalog should be opened in edit mode and artItem with
>            selected id under edit

## Root cause

`printoutTicket` in
`apps/frontend/src/features/admin/blocks/blockEditorSession/BlockEditorSession.travel.ts`
only had two branches:

```ts
switch (hit.block.lifecycle) {
    case 'template': { throw new Error(...); }
    case 'draft':    { ...dispatch select/edit ticket... }
}
// no 'saved' case → falls through, returns undefined
```

For a saved block, the function returned `undefined`, and
`handleEditHit` in `BlockEditorSession.context.tsx` silently returned:

```ts
const ticket = printoutTicket(hit);
if (!ticket) return;
```

So the click was a no-op — no journey, no error, no console output. Pure
silent failure.

The comment block at the top of the function described the intended
behavior for `saved` correctly; only the implementation was missing.
Most likely a leftover from the editor migrations that re-shaped block
lifecycle semantics (saved blocks used to be re-instantiated as drafts
on edit-entry, but the current architecture keeps them saved until
explicit dirty-write).

## Fix

Refactored `printoutTicket` to:

1. Treat `'draft'` and `'saved'` identically — both share the
   "occupied → edit, empty → select" routing semantics. Click semantics
   don't depend on persistence state.
2. Replace the `'template'` throw with `console.error` + `return` —
   consistent with the project-wide rule from
   `bug--journey--bootstrap-throws-cascade-into-blank-screen.md`:
   journey-related code paths must not throw out into unhandled
   rejections.
3. Add structured `console.log` / `console.warn` / `console.error` lines
   at every routing decision: empty-slot dispatch, occupied-slot
   dispatch, missing-artId guard, lifecycle refusal. Future repros now
   leave a trace instead of silent no-op.
4. Guard the occupied-slot branch on `item.artId` actually being
   present, rather than the previous `?? '__none__'` fallback that
   would have dispatched a known-bad ticket to the catalog (which would
   then bootstrap-fail and the user would see "Catalog Select Mode →
   blank" — see Case B below).
5. Extracted the duplicated ticket-construction into `makeTicket()` so
   the select/edit routes can't drift in shape.

## Verification

- `tsc --noEmit` clean.
- `vitest run` — 554 / 554 tests pass.
- Manual deployed-build verification pending.

## Related issue still under investigation — Case B (newly-created block)

The user reported a second symptom in the same message:

> Case B — Newly created block: If I create a new block, click an empty
> slot, choose an image, see it appear in the slot, and then click that
> same newly assigned image again:
> 1. Art Catalog opens in Select Mode.
> 2. Then the screen turns white / blank again.

A newly-created block has `lifecycle === 'draft'`, which the previous
implementation already handled. So Case A's missing-`saved` fix doesn't
directly explain Case B. Possibilities, ranked by likelihood:

1. **Stale artId path** — the previous `?? '__none__'` fallback meant
   that a draft slot whose `artId` was `undefined` (item shape bug)
   would dispatch `mode: 'edit', objectId: '__none__'`. Catalog
   bootstrap then can't find that id, falls through to
   `setScreenMode('select')` (the user's "Select Mode" sighting), and
   `returnHome` re-enters the block. If the block bootstrap is
   already-processed (Strict Mode flag), nothing handles the return →
   blank. The new guard prevents the bad dispatch entirely; no ticket
   is sent and the click becomes a no-op with a clear console error.
2. **Closure staleness** — `hit.block` could refer to a snapshot from
   before the journey return updated `block.items`. If `findIndex`
   returns -1 against the stale snapshot, the dispatch is "select"
   (matches user's "Catalog opens in Select Mode") and the bootstrap
   then loops because the item the user already created is the one
   being asked-about-again. The new logging will confirm or refute
   this.
3. **catalog refresh race** — `blockInsertArt` bootstrap fetches a
   fresh catalog, but if the second click happens before the catalog
   store updates, `resolveArt(item.artId)` could fail later in the
   render. (Rendering is unrelated to ticket dispatch though.)

The new diagnostic log lines will pin which of (1), (2), or (3) applies
when the user can repro on the deployed build.

## Generalizable rule

**Switch on enum-typed values must be exhaustive — silent fall-through
is the worst failure mode for click handlers.** `EntityLifecycle` is a
closed union of `'template' | 'draft' | 'saved' | 'published'`; any
switch on it that omits a case will silently no-op for that lifecycle
and produce a "click does nothing" symptom that's invisible in console
and impossible to reason about from outside.

When the type union widens, every consumer that switches on it needs
review. Consider adding `default: { const _: never = x; throw ... }`
exhaustiveness assertions OR (preferred for click-handler-style code
where throwing is forbidden) explicit `default:` branches that log and
no-op — they catch the gap statically and visibly.

## Related

- `bug--journey--bootstrap-throws-cascade-into-blank-screen.md` — the
  bootstrap-throw rule that this fix also follows for the `'template'`
  branch.
- `architecture--navigation--journey-system.md` — journey protocol.
- `entities/common/lifecycle.ts` — the `EntityLifecycle` union.
