# ADR-002: Editor Contexts as the Control Plane

**Status:** Accepted  
**Date:** 2026-02-23

## Context
Editor logic (CRUD, bootstrap, selection rules, Journey behaviors, destructive actions)
becomes unmanageable when spread across UI components. This leads to duplication,
unclear ownership, and architecture drift.

## Decision
Each editor provides a **Context/Provider** that acts as the editor’s **control plane**:
- owns orchestration (load/save/create/update/delete),
- owns interaction decisions (what happens on click, menu actions, etc.),
- owns guards (unsaved changes, destructive confirmations),
- integrates with Journey and external stores.

UI components are the **view plane**:
- render-only, receive data/handlers via props,
- no domain decisions, no navigation protocol decisions.

## Bootstrap Rule
Bootstrap must establish correct initial editor state on mount, including Journey mode.
Because hook-based store subscriptions can be stale on first render, bootstrap reads stores
**imperatively** (directly from store objects). Hooks are used after mount for reactivity.

## Consequences
- Cleaner separation of concerns and easier refactoring.
- Reduced duplication of domain logic across UI components.
- A stable place to implement Journey-aware behavior.

## Alternatives Considered
- Logic embedded in components (spaghetti)
- A single global provider for everything (god-context)
