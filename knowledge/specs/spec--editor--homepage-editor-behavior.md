---
type: spec
scope: [editor, navigation]
status: active
date: 2026-04-18
source_of_truth: true
tags: [homepage, home-editor, event-page, journey, behavior, preview]
---

# Homepage Editor — behavior spec

Canonical behavioral description of the Homepage Editor shipped at
`/admin/home`. Derived from
`knowledge/plans/plan--editor--homepage-editor.md` (implemented 2026-04-17).

## Scope

One singleton edit-only editor that composes the public homepage. It
references **streams** (by `streamId`) and **event pages** (by
`EventPageData.id`) only. No block-level composition. No fallback paths
to `EventData`, `useEvent`, `/api/public/events`, or
`events/catalog.json`.

## Route and mount

* URL: `/admin/home`.
* Provider chain:
  `AdminRoot → HomeEditorSessionProvider → HomeEditorPage → HomeEditor`.
* Legacy URL `/admin/public-stream` redirects to `/admin/home` via
  `<Navigate replace />`.
* Journey `editor: 'home'` resolves to `/admin/home` in
  `transporter.ROUTS`.

## Data model

* Frontend `HomeItem` = `HomeStreamRef | HomeEventRef`.
* `HomeStreamRef`: `{ kind: 'streamRef', streamId, thumbOverrideUrl? }`.
  Field `size` is tolerated on read only (legacy); never written.
* `HomeEventRef`: `{ kind: 'eventRef', eventPageId }`.
* Backend Pydantic accepts both `streamId` and legacy `streamSlug` on
  read (via `AliasChoices`), emits canonical `streamId` on write.
  `exclude_none=True` drops optional nulls on save.

## Editor surface

Session (`HomeEditorSession`) exposes:

* `homeDoc, isLoading, isSaving, isDirty, isJourney`.
* `addStreamViaJourney()`, `addEventViaJourney()` —
  Journey-driven composition. Dispatches to the stream editor (select
  mode) or event-page editor (select mode) and resumes via
  `homeInsertStream` / `homeInsertEvent` return commands.
* `openStreamItem(index)`, `openEventItem(index)` — dispatches the
  respective editor in edit mode; no return effect.
* `removeItem(index)`, `reorderItems(items)` — local draft mutations.
* `save()` — `PUT /api/admin/home`; on success commits snapshot.
* `discard()` — reverts draft to snapshot.
* `preview()` — stashes draft in `localStorage['__preview_home_doc']`
  and opens `/preview` in a new tab (renders the full public homepage,
  not editor chrome). The `/preview` route wraps in `ArtCatalogLoader` only —
  it deliberately does **not** mount `EventsLoader`, so preview never hits
  `/api/public/events`. Event references resolve via the admin catalog
  through `useHomeFeed`'s `isAdmin` branch.
* `exit()` — `useGuardedNavigate('/admin')`.

## Bootstrap

Runs on every mount of `HomeEditor` (route transitions, reloads, journey
returns). Never trusts previously primed stores — always refreshes sources.

1. Synchronous `arrival('home')` (strict-mode guarded via `bootstrappedRef`).
2. `refreshEventPages()` — unconditional `GET /api/admin/event-pages`,
   writes to `eventPagesStore` (reactive). The Homepage Editor resolves
   eventRef items against this admin store, not the public
   `eventPagesModule` (which is status-filtered).
3. Unconditional `GET /api/admin/streams` — writes to `streamsIndexStore`.
4. `homeDocAdminApi.get()` → server `doc`.
5. **Capture the in-memory draft before touching the snapshot:**
   `inMemoryDraft = editSessionsDataStore.get(HOME_KEY)?.draft`.
   If absent, attempt to restore from
   `localStorage['__home_doc_draft']` (see Draft persistence below).
6. `setSnapshot(HOME_KEY, doc)` — note this clobbers draft as a side
   effect; see the Draft/Snapshot pattern for the read-order rule.
7. Compute `base = recoveredDraft ?? doc`.
8. If returning with `loot.ok` + `returnEffect.kind`:
   * `homeInsertStream` → append `{kind:'streamRef', streamId: loot.id}` if
     not already in `base` (dedup against draft, not just server).
   * `homeInsertEvent` → append `{kind:'eventRef', eventPageId: loot.id}` if
     not already in `base`.
   * Any other / missing → `base` unchanged.
9. `saveDraft(HOME_KEY, nextDraft)` — final draft = base (± effect item).

Consequence: navigating away and back preserves composition draft;
Journey returns apply their effect exactly once even across duplicate
invocations; orphan tiles persist in draft when underlying entities are
deleted (draft survives, resolver misses, `OrphanTileAdmin` renders).

## Draft persistence

`EditSessionsDataStore` is in-memory only; hard reloads erase it. The
Homepage Editor layers a persistent tier on top:

* Key: `localStorage['__home_doc_draft']` (distinct from the preview key
  `__preview_home_doc`).
* Write: a direct `editSessionsDataStore.subscribe(...)` listener (not a
  React `useEffect`) writes the draft to localStorage on every emit
  **where the draft differs from the snapshot**. It **never** removes
  the key. Driving the write from a React state effect keyed on
  `isDirty` would observe the transient `setSnapshot`-clobbered clean
  state during bootstrap and remove the persisted key mid-mount. The
  subscription bypasses React render batching entirely.
  See `pattern--state--draft-snapshot.md` § Cross-reload persistence.
* Read: bootstrap reads the key as a fallback when the in-memory draft
  is absent (e.g. after a reload).
* Clear: `save()` removes the key after successful commit; `discard()`
  removes it when reverting to snapshot. These are the **only** paths
  that remove the key.

Net effect: a hard refresh mid-composition recovers the draft; once
saved or discarded, the key is cleaned up and subsequent mounts start
from server state.

## Rendering

Admin tiles:

* `HomeStreamTileAdmin` — thumbnail from `streamsIndexStore`, Stream badge, Open + Remove.
* `HomeEventTileAdmin` — preset badge, title (en), optional `dateStart`, Open + Remove.
* `OrphanTileAdmin` — rendered when a reference fails to resolve. Warning styling, Remove only. Resolution rules:
  * `streamRef` is resolved iff the stream exists in `streamsIndexStore` **and** its `status !== 'archived'`. Archived streams are treated as unresolved so that the backend's default archive-on-delete produces the same user-facing orphan experience as event-page hard-delete.
  * `eventRef` is resolved iff `eventPagesStore.pages[eventPageId]` exists.

All three are drag-sortable via `dnd-kit`. Reorder updates the draft.

Attention banner appears above the compose row when any orphan is
present. Save is never blocked by orphans — unresolved tiles are
silently skipped on the public homepage.

Public tile for an eventRef is
`features/public/ui/HomeEventTile/HomeEventTile.tsx`. It reads
`EventPageData` only (title, preset, optional `dateStart`) and resolves
`page.heroImage` through the public `mediaItemsModule` cache (primed
by `useHomeFeed`), with the public `ArtCatalogProvider` as fallback.
The tile takes a `mode` prop: in `public` mode the link points at
`/event/:id`; in `preview` mode the link points at `/preview/event/:id`
(admin-backed, see "Preview event routing" below). A first-class
curated tile representation owned by EventPage remains an open
question — see `open-questions/open_question--event--event-page-tile-model.md`.

## Preview event routing

The preview route tree mounts `<EventPage mode="preview" />` at
`/preview/event/:id`. In preview mode `EventPage` fetches
`/api/admin/event-pages/:id` instead of the public endpoint, so draft
pages (which the public filter excludes) are visible. Homepage tile
clicks in preview use this path automatically via the `HomeEventTile`
mode prop. Public `/event/:id` behavior is unchanged.

## Journey contract

| Action | ToAddress | ReturnCommand | Loot id |
|---|---|---|---|
| Add Stream | `{editor:'stream', mode:'select'}` | `homeInsertStream` | `streamId` |
| Add Event | `{editor:'eventPages', mode:'select'}` | `homeInsertEvent` | `eventPageId` |
| Open Stream | `{editor:'stream', mode:'edit', objectId}` | `undefined` | — |
| Open Event | `{editor:'eventPages', mode:'edit', objectId}` | `undefined` | — |

`ReturnAddress` is always `{editor:'home', mode:'edit', objectId:'home-doc'}`.

## Anti-regression (ESLint)

`eslint.config.js` has a scoped block covering
`src/features/admin/homeEditor/**`,
`src/features/public/ui/HomeEventTile/**`, and
`src/features/public/hooks/useHomeFeed.ts`:

* Bans `useEvent` import from `@/shared/EventsProvider` (any form).
* Bans named `EventData` import from `@/entities/event`.
* Bans string literals containing `/api/public/events` or
  `events/catalog.json`. Does not match the canonical
  `/api/public/event-pages`.

## Homepage visibility is derived solely from HomeDoc

After the Homepage Editor cutover and the subsequent retirement of the
`public_stream` subsystem, "is this stream on the public homepage?"
has exactly one answer, computed from `HomeDoc.items`. The stream
editor has no Publish/Unpublish surface; authoring a stream does not
itself make it visible. Visibility is granted by adding a streamRef
via the Homepage Editor. The public header menu and the public
`/public/streams/published` endpoint both project HomeDoc streamRefs.

See: `decision--data--homedoc-is-sole-homepage-source.md`.

## Related

* Plan: `knowledge/plans/plan--editor--homepage-editor.md`
* Decision: `knowledge/decisions/decision--data--homedoc-is-sole-homepage-source.md`
* Journey architecture: `architecture--navigation--journey-system.md`
* Domain model: `architecture--data--domain-model.md`
* Open questions driving future work:
  * `open_question--event--event-page-tile-model.md`
  * `open_question--event--public-shareable-event-page-link.md`
