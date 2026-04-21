---
type: architecture
scope: [data, architecture]
status: active
date: 2026-04-17
source_of_truth: true
tags: [constitution, domain-model]
---

# Domain model

## Entity relationships

```
                       ┌─────────────┐
                       │  HomeDoc     │
                       │  (singleton) │
                       └──────┬───────┘
                              │ references (streamId | eventPageId)
                ┌─────────────┴──────────────┐
                ▼                             ▼
         ┌────────────┐                ┌──────────────┐
         │  Stream    │                │  Event       │
         │  (ordered  │                │ (preset-based│
         │   blockIds)│                │  EventPage)  │
         └─────┬──────┘                │   holds      │
               │ references (by ID)    │ enrollments  │
               ▼                       └──────────────┘
         ┌───────────┐
         │  Block    │
         │ (gallery/ │──references───▶ ArtItem
         │  text/cta)│  (by ID)
         └───────────┘
```

All relationships are by-ID references, not containment. Stream stores `blockIds[]` (string array). Block stores `artId` (string field) — the legacy `eventId` field on blocks remains for data compatibility but is not part of the canonical flow: homepage composition references events only via `HomeDoc.items[*].eventRef.eventPageId`. Block-level homepage composition was retired in the Homepage Editor cutover (2026-04-17); the legacy EventData entity was retired in the EventPage canonicalization (2026-04-21).

## Domain entities (per Constitution)

| Entity | ID format | Lifecycle states | Storage |
|--------|----------|-----------------|---------|
| ArtItem | `art-YYYYMMDD-{base32(6)}` | template, draft, saved, published | `art_catalog.json` |
| Block | `block-{kind}-{layout?}-{uuid8}` | template, draft, saved | `block_collection.json` |
| Stream | `stream-YYYYMMDD-{base32(6)}` | draft, ready, archived | `streams/index.json` + individual files |
| Event | `event-YYYYMMDD-{base32(6)}` | draft, scheduled, closed | `event_pages/catalog.json` (in-code type: `EventPageData`) |
| HomeDoc | (singleton) | N/A | `public/home.json` |

## Block type system (discriminated union on `blockKind`)

| Kind | Content | Key fields |
|------|---------|------------|
| `gallery` | Art image layouts | `layout`, `items[]` (GalleryBlockItem), `appearance?` |
| `text` | Localized title + body | `title`, `body`, `variant` (full/narrow/quote) |
| `cta` | Call-to-action | `title`, `body`, `buttonLabel`, `target` (CtaTarget) |
| `eventCta` | Single-event promo | `eventId`, `buttonLabel` |
| `composable` | Mixed-content slots | `layout`, `slots[]` (BlockSlot with Renderable), `appearance?` |

Gallery layouts: `single`, `pairHorizontal`, `pairVertical`, `triptychLeft`, `triptychRight`, `triptychHorizontal`.

## Entity modules in code

11 directories under `entities/`:

| Module | Primary exports | Notes |
|--------|----------------|-------|
| `art/` | `ArtItem` (class), `ArtItemData` | Class with `fromJSON()`/`toJSON()` |
| `block/` | `Block` (discriminated union), `BlockAppearance`, `LAYOUT_SCHEME` | Most complex entity |
| `catalog/` | `ArtCatalog` | Wrapper around ArtItemData records |
| `common/` | `Localized`, `Money`, `Dimensions`, `EntityLifecycle`, `ISODate` | Shared value types |
| `event/` | `EventData`, `EventPageData`, `EventPreset` | Includes event page presets |
| `homeDoc/` | `HomeDoc`, `HomeItem`, `HomeStreamRef`, `HomeEventRef` | Singleton homepage composition model — streamRef (canonical `streamId`) + eventRef (→ `EventPageData.id`) |
| `hopper/` | `HopperItem` | Minimal, no index.ts barrel |
| `mediaItem/` | `MediaItemData`, `MediaSources`, `MediaItemCatalog` | Utility entity |
| `renderable/` | `Renderable` (discriminated union), `RenderableResolver` | Content type system |
| `stream/` | `StreamData`, `StreamIndexItem`, `StreamsIndex` | Pure types |
| `textVisual/` | `TextVisualData`, `TextVisualCatalog` | Composable text content |

## Content reference types

- `artId: string` → ArtItem in catalog
- `eventPageId: string` → Event (EventPageData) — used by `HomeEventRef`. Canonical reference form post-2026-04-21.
- `streamId: string` → Stream (used by `HomeStreamRef`; backend also tolerates legacy `streamSlug` on read)
- `MediaRef = string` → MediaItem ID
- `blockIds: string[]` → Block IDs in a Stream

Legacy: `eventId` fields on `EventCtaBlock` and `EventPageData.eventId` are retained for data compatibility only. They do not participate in the canonical event reference flow; new consumers should use `eventPageId` exclusively.

## Related

- [Entities are finite and controlled](../invariants/invariant--architecture--entities-are-finite-and-controlled.md)
- [Overall structure](architecture--system--overall-structure.md)
