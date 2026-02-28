# ADR-004: Dual Editor Mode Pattern (Select Mode vs Single Item Edit)

**Status:** Accepted  
**Date:** 2026-02-23

## Context
Editors share a common user mental model:
- browse/select from a grid of items,
- then focus on one item for editing.

Without a shared pattern, each editor diverges in UX and internal structure, and
Journey integration becomes inconsistent.

## Decision
All editors (except Hopper) implement two modes:
1) **Select Mode** — grid of thumbnails for the entity (plus templates where applicable).
2) **Single Item Edit Mode** — focused editor for one item + metadata.

Select Mode may run in different intents (browse, select-for-caller via Journey, etc.).

## Filtering (To-Be / partial)
Select Mode provides filtering by entity metadata (tags, technique, layout, etc.).
Filtering must be a derived view and must not mutate the source-of-truth collection.

## Consequences
- Predictable UX across editors.
- Reusable patterns for selection, templates, and Journey integration.

## Alternatives Considered
- Unique UX per editor (increases drift and maintenance cost)
