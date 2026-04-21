---
type: decision
scope: [data, navigation]
status: active
date: 2026-04-18
source_of_truth: true
tags: [homepage, home-doc, public-stream-retired, visibility]
---

# HomeDoc is the sole source of truth for homepage visibility

## Context

During the Homepage Editor migration, two overlapping notions of "public"
existed:

1. **HomeDoc** (`vault/json/public/home.json`) — composition of the public
   homepage. Shipped in the Homepage Editor v1 cutover.
2. **PublicStream** (`vault/json/public_stream.json`) — a separate roster
   of stream IDs that the legacy stream editor's "Publish"/"Unpublish"
   surface wrote to. Inherited from the pre-HomeDoc architecture.

After Phase 6 of the Homepage Editor rollout, the public homepage, the
public `/public/streams/published` endpoint, and the public header menu
all read from HomeDoc. `public_stream.json` became a write-only sink
that no rendering consumed — a dead subsystem with a live "Publish"
button still attached to it.

## Decision

Retire the entire `public_stream` subsystem. HomeDoc is the single
store for "what is visible on the public homepage" and the single
signal for header navigation built on top of that.

Concretely:

* `public_stream.json`, the `/admin/public_stream*` endpoints, the
  `PublicStream` Pydantic model / repo, the `publicStreamApi` frontend
  client, the `PublicStream` entity class, the `usePublicStream` hook,
  and the `onPublish`/`onUnpublish`/`isPublished` toolbar surface are
  removed.
* The stream editor loses its `Publish` / `Unpublish` buttons and the
  `PUBLIC` badge in select mode.
* `/public/streams/published` is rewritten to project
  `HomeDoc.items.streamRef` into `StreamIndexItem[]`.
* `/admin/streams/{id}/dependencies` is rewritten to check HomeDoc for
  referencing streamRefs; response renamed from `isPublished` to
  `isOnHomepage`.
* The public header menu reuses `useHomeFeed` and derives the stream
  list from HomeDoc's streamRefs.
* The `_migrate_from_public_stream` fallback is removed from
  `home_doc_repo`; new environments start with an empty HomeDoc.
* The `/preview` route drops `EventsLoader` from its wrapper chain.
  Preview resolves event references through the admin event-pages
  catalog (via `useHomeFeed`'s `isAdmin` branch) and therefore makes no
  call to `/api/public/events`. This extends the "sole source" contract
  to the preview path: preview is a draft projection of HomeDoc using
  admin-side resolvers, with no legacy `EventData` dependency.
* The public footer's "Explore" section has since been removed entirely
  (duplicated the header navigation and added no distinct value). The
  footer is now a 2-column layout: legal/contact + Get-in-touch/CTA. It
  no longer reads from HomeDoc; `useHomeFeed` is not imported there.
* The block editor's "Add Event" toolbar entry is removed. Block-level
  event attachment for the homepage is no longer a composition path —
  events reach the homepage only via HomeEventRef composed in the
  Homepage Editor. The `addEvent` `ToolKey`, `AddEventButton`,
  `addEventAndJourney` session method, and `EVENT_TARGET_SLOT` wiring
  are removed. `EventCtaBlock` entities already persisted in streams
  continue to render.

## Consequences

**Positive**

* Single source of truth. "Is this stream on the public homepage?" has
  one answer, computed from HomeDoc. No reconciliation logic.
* Cleaner Stream Editor responsibility: author streams. Homepage Editor
  decides what the public sees.
* Deleting a stream now checks a single, authoritative signal; the
  warning copy and destructive-action steps become honest.

**Negative**

* Stream authors lose the "Publish" button as a one-click surface. To
  feature a stream on the homepage they now open the Homepage Editor
  and use "Add Stream" (a Journey flow). This is a deliberate trade:
  one less ambiguous knob, one more purposeful navigation step.
* Environments holding a live `public_stream.json` with no matching
  `home.json` lose the auto-migration. This is acceptable because the
  Homepage Editor migration has already shipped; ops confirms every
  environment has a `home.json`.

**Operational**

* Before deploy: confirm each environment has `public/home.json`. The
  `public_stream.json` file is deleted from the vault in the same
  change.

## Alternatives considered

* **Reconnect** `public_stream.json` to homepage rendering — rejected.
  Regresses the Homepage Editor plan.
* **Redefine** `public_stream.json` as a "published streams pool" /
  visibility layer separate from homepage composition — rejected. No
  product requirement today for a third state; adding one would codify
  speculative dead code rather than a real concept.

## Future

If per-stream visibility gating is ever needed (e.g., hide a draft
stream from direct-URL access), it should be designed as a field on
the stream entity itself (`visibility: 'public' | 'unlisted' | 'draft'`
or similar), not as an external roster.

## Related

* `knowledge/plans/plan--editor--homepage-editor.md`
* `knowledge/specs/spec--editor--homepage-editor-behavior.md`
* `knowledge/architecture/architecture--data--domain-model.md`
