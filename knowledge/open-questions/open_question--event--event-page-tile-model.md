---
type: open_question
scope: [event, renderer]
status: active
date: 2026-04-18
source_of_truth: false
tags: [event-page, homepage, tile, follow-up, post-v1]
---

# EventPage needs a first-class tile representation owned by EventPage

## Out of scope

**Not** part of Homepage Editor v1
(`knowledge/plans/plan--editor--homepage-editor.md`). Do not fold the work
described here into the current milestone or any current phase.

## Observation

Homepage tiles are currently split by type:

* **Stream** tiles read `StreamIndexItem` (title, thumbnail) authored inside
  the stream metadata editor.
* **EventPage** tiles (new, shipped in Phase 2 of Homepage Editor v1 as
  `HomeEventTile`) render text-only — title, preset badge, optional
  `dateStart`. They do **not** render `heroImage` because there is no public
  media-catalog resolver on the homepage yet, and — more importantly — there
  is no curated tile representation for an EventPage at all.

The right analogy is the stream tile: an EventPage should expose a
dedicated **tile surface** that the homepage consumes, not one that the
Homepage Editor invents.

## Requirement (capture only)

An EventPage must have its own first-class tile representation. Concretely:

1. **Dedicated tile surface** — a shape distinct from the EventPage hero
   section, purpose-built for homepage tile slots.
2. **Tile image(s)** — a tile-specific media asset (not necessarily the hero
   image; could be a crop or an alternate composition).
3. **Tile captions / tile text** — tile-specific title/caption authored for
   the tile context, not just the page title reused.
4. **Authored inside the EventPage editor** — the tile is a property of the
   EventPage, not of the HomeDoc. Homepage Editor consumes it; it never
   invents or edits it.
5. **Homepage consumes, never composes** — `HomeEventTile` and any admin
   counterpart read the tile representation; they do not fall back to
   ad-hoc rendering.

## Impact on v1

`HomeEventTile` in v1 is a minimal placeholder satisfying the v1 plan
(reference tiles via EventPageData). It now renders `page.heroImage`
using the public `mediaItemsModule` cache with an `ArtCatalogProvider`
fallback (added 2026-04-18 as a bug-fix pass) — it is **not** the
final tile. The open requirement is a dedicated `EventPageTile`
representation authored in the EventPage editor (see "Requirement"
above), not a reuse of `heroImage`. Replacing the current rendering
with the proper tile model must not require any HomeDoc schema change —
the reference type `HomeEventRef { eventPageId }` is already
schema-stable.

## Possible shape (informal, not a decision)

```ts
type EventPageTile = {
  image: MediaRef;           // tile-specific, independent of heroImage
  title: Localized;          // may differ from page.title
  caption?: Localized;
  // possibly: layout hint, badge overrides, etc.
};

// On EventPageData: tile?: EventPageTile
```

## Dependencies

* Public media resolver on the homepage (currently admin-only). Without it,
  tile images cannot render publicly regardless of where the tile model is
  authored.
* Design pass on tile content rules — one tile per EventPage, or multiple
  tile layouts per page?

## Expected next step

A dedicated design/spec round when the EventPage roadmap is touched next.
Until then: no change, no placeholder, no half-implementation.

## Evidence

* `apps/frontend/src/features/public/ui/HomeEventTile/HomeEventTile.tsx`
  (text-only v1 placeholder).
* `apps/frontend/src/entities/event/eventPage.types.ts` — `heroImage` is
  page-level, not tile-level.
* Plan §6 of `knowledge/plans/plan--editor--homepage-editor.md` — orphan
  handling and admin tiles explicitly treat the reference as opaque.
