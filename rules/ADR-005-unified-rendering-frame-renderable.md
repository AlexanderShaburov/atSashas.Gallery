# ADR-005: Unified Rendering Model (Frame + Renderable)

**Status:** Proposed (To-Be)  
**Date:** 2026-02-23

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

## Alternatives Considered
- Screen-specific rendering (continues drift)
- Theme-only styling without per-object appearance (insufficient flexibility)
