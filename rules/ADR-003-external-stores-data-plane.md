# ADR-003: External Stores as the Data Plane

**Status:** Accepted  
**Date:** 2026-02-23

## Context
React Context is great for scoping and injection, but it becomes problematic when used as the
primary owner of cross-screen/persistent state. Editor contexts started growing into global
databases, which breaks isolation and makes mount/unmount flows fragile.

## Decision
Use **external stores** (outside React) as the **data plane** for:
- Journey stack/tickets,
- cross-editor session state,
- global collections/lists (streams list, catalog list, etc.),
- global UI settings (e.g., theme), where appropriate.

Contexts orchestrate actions; stores hold durable state.

## Consequences
- Reduced coupling to React lifecycle.
- Easier to add persistence strategies later (URL/localStorage/backend) without redesign.
- Less risk of god-context and drift.

## Rules
- A piece of state must have a single source of truth (no double-ownership).
- Context may keep derived/local UI state, but not own global truth.

## Alternatives Considered
- Context-only state (drifts and breaks across mounts)
- Router-only state (insufficient for rich editor sessions)
