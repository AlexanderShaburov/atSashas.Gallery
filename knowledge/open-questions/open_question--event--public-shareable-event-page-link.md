---
type: open_question
scope: [event, navigation]
status: active
date: 2026-04-17
source_of_truth: false
tags: [event-page, public-url, shareable, follow-up, post-v1]
---

# EventPage needs a first-class direct public link (shareable URL)

## Out of scope

**Not** part of Homepage Editor v1
(`knowledge/plans/plan--editor--homepage-editor.md`). This item is
captured for later work; do not absorb it into any current phase.

## Observation

EventPages are currently reachable at `/event/:id` and are rendered by the
public EventPage route, but direct-link sharing is not treated as a
first-class use case in the product:

* The authoring flow has no explicit "get shareable link" affordance.
* There is no documented, copyable public URL surface for collaborators,
  partners, or external placements (e.g. partner site embeds, email
  campaigns, social posts).
* The homepage tile is the implicit entry point, which mixes discovery
  (homepage) with direct-access (link sharing) — two different use cases.

## Requirement (capture only)

Each EventPage should be directly shareable by URL as a first-class
capability, independent of whether it is featured on the homepage.

This means at minimum:

1. **Canonical public URL** — each EventPage has one stable, human-shareable
   URL. (Today: `/event/:id`; may or may not be the final shape — slug vs id
   is an open design choice.)
2. **Author-visible share affordance** — the EventPage editor surfaces the
   public URL with an explicit copy/share action.
3. **Independent of homepage rendering** — the link works, is documented,
   and is owned by EventPage irrespective of whether the page is featured
   on the home feed.
4. **First-class use case** — treated as a supported product path, not an
   implementation detail of the routing table.

## Impact on v1

None on Homepage Editor v1. The existing `/event/:id` route continues to
work. Homepage tiles continue to link to it. No scope change is implied.

## Expected next step

Separate design round covering:

* URL shape (slug vs id; redirects from legacy forms; SEO implications).
* Editor-surface share UX.
* Possibly: preview link for unpublished pages.

## Related

* `knowledge/plans/plan--editor--homepage-editor.md` — the Homepage Editor
  consumes `/event/:id` via `HomeEventTile`, but owns neither the URL nor
  the sharing surface.
* `open_question--event--event-page-tile-model.md` — adjacent follow-up
  about the tile representation. These two items may be scheduled together
  but are independent in scope.

## Evidence

* `apps/frontend/src/app/router.tsx` — `/event/:id` is the current public
  entry point.
* EventPage authoring UI
  (`apps/frontend/src/features/admin/eventPageEditor/ui/EventPageEditor.tsx`)
  has no "copy link" / "share" affordance.
