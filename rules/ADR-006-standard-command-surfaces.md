# ADR-006: Standard Command Surfaces (SingleEditorToolbar + Three-Dot Menu)

**Status:** Accepted (Toolbar: needs standardization)  
**Date:** 2026-02-23

## Context
Editors require many actions. If actions are implemented ad-hoc, UX and code drift.
A consistent command surface is needed for:
- primary actions (save/apply, create, add),
- secondary actions (duplicate, delete, move, etc.).

## Decision
- Use **SingleEditorToolbar** as the standard **primary** action surface.
  - Context provides handlers/capabilities; UI decides which tools to show.
  - Save vs Apply semantics are defined by ADR-001 when Journey is active.
- Use **Three-Dot Menu** as the standard **secondary** action surface for list items.

## Consequences
- Predictable UX.
- Clear expansion path without scattering controls across screens.

## To-Be
Toolbar must be standardized so all editors follow the same logic and tool composition rules.

## Alternatives Considered
- Separate bespoke toolbars per editor (drifts quickly)
