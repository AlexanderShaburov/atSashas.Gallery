# ADR-005: Unified Rendering Model (Frame + Renderable)

**Status:** In Progress
**Date:** 2026-02-23
**Updated:** 2026-03-01

## Context
Rendering of core entities (Block / Stream thumbnail / ArtItem preview/full) drifted across screens.
Styles and layout logic became duplicated and inconsistent, making it hard to:
- keep visuals coherent,
- add user-editable appearance,
- ensure responsive consistency (HomePage vs editor grids vs public pages).

## Decision
Introduce a unified rendering system:
- A **Frame** provides the container and consistent behavior (sizing, padding, click areas, etc.).
- A **Renderable** contract describes what is rendered and how:
  - kind: block | stream | artItem | event | ...
  - ref: id / reference
  - mode: thumbnail | card | embedded | full
  - appearance: data-driven styling parameters (user-editable where applicable)

## Scope
- Block rendering in streams and editor previews
- Stream thumbnail rendering in lists/HomePage/public
- ArtItem preview/full rendering

## Consequences
- Centralized styling rules and fewer duplicated render paths.
- Natural place to implement custom appearance (Blocks and Stream thumbnails).
- Easier enforcement of responsive grid contracts.

## Migration Strategy
- No mandatory big-bang rewrite.
- Any touched/new rendering code must converge toward Frame+Renderable.

## Open Questions
- Exact appearance schema (per entity vs shared)
- Persistence of appearance (stored in entities vs dedicated style layer)

## Implementation Notes (Wave 4 — 2026-03-01)

### Completed
- **Frame component** created at `shared/ui/Frame/` with modes: `embedded | card | thumbnail`
- **ArtPicture component** created at `shared/ui/ArtPicture/` — shared `<picture>` element replacing 4 duplicated render paths
- **LAYOUT_SCHEME unified** — single source of truth in `entities/block/block.types.ts`, duplicate constants (`ITEM_POSITIONS`, `RENDER_ORDER`) deleted
- **Shared formatters** extracted — `formatEventDate`, `formatPrice`, event status helpers moved to `shared/lib/`
- **QuickView panel** implemented at `shared/ui/QuickView/` — metadata-first click behavior per Constitution Section 11
- **ThreeDotMenu** extended to block collection grid per Constitution Section 7
- **Frame adopted** in CollectionGrid — each block card wrapped in `<Frame mode="card" aspectRatio="4/3">`

### Deferred
- Full Renderable type contract — will be introduced when custom appearance (colors, spacing) is implemented
- Frame adoption in stream thumbnails and public pages — incremental convergence per touch-and-converge strategy

## Alternatives Considered
- Screen-specific rendering (continues drift)
- Theme-only styling without per-object appearance (insufficient flexibility)
