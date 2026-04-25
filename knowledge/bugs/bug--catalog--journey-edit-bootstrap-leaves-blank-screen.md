---
type: bug
scope: [navigation, journey, frontend, catalog]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [journey, catalog, bootstrap, edit-mode, blank-screen, draft-store]
---

# Catalog edit-mode journey arrival rendered a blank screen and stranded the journey

## Symptom

Both Case A (saved block, re-click occupied slot) and Case B (newly
created block, re-click newly assigned slot) ended in the same compound
failure:

1. Click image on slot in Block Editor.
2. Routing dispatches an EDIT journey to Catalog
   (`destination: { editor: 'catalog', mode: 'edit', objectId: artId }`).
3. URL changes to `/admin/catalog`. Catalog mounts.
4. **Catalog renders blank** — no toolbar, no form, no exit affordance.
5. User hits browser-back to escape. Block Editor remounts.
6. Block Editor's `arrival('block')` throws
   `JourneySession: Arrival on unexpected editor block instead of catalog`,
   which the React error boundary surfaces as an "Unexpected
   Application Error" page.
7. Header navigation reports "Journey is currently active". The session
   is stuck until full reload.

## Root causes (two, compounding)

### 1. Catalog bootstrap edit-branch never populated the draft store

`CatalogEditorSession.context.tsx` exposes two ways to enter edit mode:

- `editById(id)` — synchronous, click-driven. It does:
  ```ts
  setSelectedItemId(id);
  editSessionsDataStore.saveDraft<ArtItemData>(key, item);
  editSessionsDataStore.commit<ArtItemData>(key);
  setThumb({ id, thumbUrl, title });
  setScreenMode('edit');
  ```
- The bootstrap effect's `case 'edit':` branch (journey-driven). Before
  this fix it did:
  ```ts
  setSelectedItemId(id);
  setScreenMode('edit');
  ```
  No `saveDraft`. No `commit`. No `setThumb`.

`SingleArtItemEditor` is rendered by `CatalogEditorPage` only when
`isSelected && editorIsReady`. `editorIsReady` requires a non-empty
`draft`, which is read from `useSessionDataStore({ kind: 'catalog', id })`.
Without `saveDraft+commit`, the draft is `undefined`, `editorIsReady`
is `false`, and `CatalogEditorPage`'s `screenMode === 'edit'` branch
renders just an empty `<div className="catalog-page" />` — i.e. a
blank screen with no UI affordances.

### 2. `journeySessionStore.arrival` threw on stale-leg back-nav

Once the user hit browser-back (their only escape from the blank page),
Block Editor remounted and its bootstrap called `arrival('block')`. The
top journey leg still had `destination.editor === 'catalog'` (catalog
never finished — see #1), so `arrival` threw:

```ts
throw new Error(
    `${LOG_PREFIX} Arrival on unexpected editor ${editor} instead of ${expectedEditor}`,
);
```

The throw inside the bootstrap async IIFE is exactly the failure mode
the project rule from
`bug--journey--bootstrap-throws-cascade-into-blank-screen.md` was
written to prevent — but that rule was applied to the *editor*
bootstraps, not to `arrival` itself. So the call site dutifully called
`arrival(editor)` and the store dutifully threw, and the rule was
silently bypassed at the layer below.

## Fixes

### 1. `CatalogEditorSession.context.tsx` bootstrap edit branch

Added `saveDraft + commit + setThumb` before `setSelectedItemId +
setScreenMode`. The journey-driven entry now leaves the catalog editor
in the same state as the click-driven entry. Both paths must populate
the same stores; the subtle divergence was the bug.

### 2. `journeySession.store.ts` arrival stale-leg recovery

Replaced the throw on unexpected-editor with: log diagnostic, clear
the active session, return `undefined`. The arriving editor sees "no
journey" and mounts fresh. The user can navigate normally; they don't
get an error page, and the in-flight (impossible-to-finish) journey
doesn't keep blocking header navigation.

## Why both fixes are needed

Fix 1 alone would prevent the blank screen for the happy path. But any
future variant where catalog can't render (deleted item, network
failure, dependency error mid-bootstrap) would re-create the blanks-
then-stranded-journey cascade.

Fix 2 alone would let the user back out of the blank page without the
"Unexpected Application Error", but they'd still get the blank in the
first place.

Together: the happy path now renders the editor; failure paths can
back out cleanly.

## Generalizable rules

### Rule: dual entry paths into an editor mode must populate identical
state

Click-driven entry (`editById`) and journey-driven entry (bootstrap
`case 'edit':`) end at the same screenMode but were initialized
through different code. Any state used by the rendered components
(`draft`, `thumb`, `selectedItemId`, `screenMode`) must be set by both
paths, or one path will land in a degraded view that the other works
fine in.

When adding a new state field that the editor reads, audit BOTH entry
paths. A single-path update is a latent regression for the other.

### Rule: journey-store assertions don't get to throw either

The bootstrap-throw rule
(`bug--journey--bootstrap-throws-cascade-into-blank-screen.md`) covers
editor-side bootstraps. But anything called *from* a bootstrap async
IIFE inherits the same constraint: a throw at any depth becomes an
unhandled promise rejection at the bootstrap. The journey store is a
direct dependency of every bootstrap; its `arrival` must signal
unexpected-editor with `undefined` + diagnostic + state cleanup, not
with `throw`.

## Verification

- `tsc --noEmit` clean.
- `vitest run` — 554 / 554 tests pass.
- Manual deployed-build verification pending.

## Related

- `bug--journey--reclick-assigned-slot-no-action-on-saved-block.md` —
  Step 1 of this fix sequence (added 'saved' lifecycle case so
  saved-block clicks dispatch a journey at all). This bug exposed
  Step 2: where that journey actually lands.
- `bug--journey--bootstrap-throws-cascade-into-blank-screen.md` — the
  general rule about throws in bootstraps; this fix extends the rule
  to `arrival`.
- `architecture--navigation--journey-system.md` — journey protocol.
- `CatalogEditorSession.context.tsx::editById` — the click-driven
  entry path that must stay in sync with the bootstrap path.
