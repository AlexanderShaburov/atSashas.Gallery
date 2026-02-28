# ADR-007: Quick View Panel Before Full View (Public UX)

**Status:** Proposed (To-Be)  
**Date:** 2026-02-23

## Context
Immediate full-screen opening on first click hides metadata and disrupts the browsing context.
For potential buyers, metadata (size, technique, price, availability) must be accessible quickly.

## Decision
Implement a two-step interaction:
1) **Quick View panel** (popover/card) appears on first click near the clicked preview:
   - key metadata (size, technique/materials, availability, price),
   - CTA: **View details / Full view**,
   - future CTA: **Request to buy / Reserve / Contact**.
2) Full View opens only after explicit CTA, preferably in the same tab with a reliable return.

## Consequences
- Better browsing UX and clearer intent.
- A natural entry point for commerce-related actions.

## Alternatives Considered
- Immediate full view
- Open in a new tab by default
