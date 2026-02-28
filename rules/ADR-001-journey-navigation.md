# ADR-001: Journey as the Only Cross-Editor Navigation Protocol

**Status:** Accepted  
**Date:** 2026-02-23

## Context
Editors are not isolated: users frequently perform nested tasks across editors
(e.g., Stream → Block → Catalog → Hopper) and must return with a result.
Without a single protocol, the app drifts into ad-hoc routing, query params,
and duplicated return logic, which breaks consistency and maintainability.

A key requirement is that Journey state must survive editor mount/unmount and must be readable
during editor bootstrap. This is why Journey data cannot live only in React component state.

## Decision
SashaGallery uses **Journey** as the *only* allowed protocol for cross-editor navigation
that requires:
- returning to the caller,
- passing a result (selection/created entity),
- supporting deep nesting.

### Implementation-level decision: External store + Ticket model
Journey state is stored in an **external store** (outside React). A Journey is represented by a
**single JourneyTicket** that is written into the external store and evolves over time.

- **One Journey = one ticket** (the ticket is created when the journey starts).
- The ticket contains multiple **legs/segments** (added as the journey goes deeper):
  - outbound legs (caller → destination),
  - return legs (destination → caller),
  - optional payload/loot (JumpResult) returned upward.
- Editors read the current ticket/leg from the external store during bootstrap and configure
  their initial mode accordingly.

This is intentionally external-store-based so it remains available across route changes and
editor unmount/remount.

### UX Guardrails (part of the decision)
- While a Journey is active, **header navigation and burger menu routes are disabled/guarded**
  to prevent accidental journey breakage.
- Editors in Journey mode must distinguish:
  - **Save** = persist but remain in editor (no Journey advancement)
  - **Apply** = complete current leg and return with result

## Consequences
- Each editor must implement a Journey-aware bootstrap and completion protocol.
- Cross-editor “returnTo” via URL/query/props is disallowed.
- The app gains a uniform way to support nested flows without state spaghetti.
- Any future persistence strategy (URL/localStorage/backend) can be built around the external store model.

## Non-Goals
- Full resilience to browser refresh/tab close is not guaranteed yet.
  Guardrails are required; persistence/resume may be addressed later.

## Alternatives Considered
- Router-only returnTo params (drifts and breaks with nesting)
- Prop-drilling return callbacks (does not scale)
- Global monolithic React context for everything (blurs boundaries)
