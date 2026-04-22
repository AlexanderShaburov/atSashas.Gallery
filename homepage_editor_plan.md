# Homepage Editor — Final Implementation Plan (Locked)

## 1. Overview

We are replacing the legacy **Public Stream editor** with a proper **Homepage Editor**.

Homepage becomes a **singleton editor surface** that composes:

- Stream tiles
- Event tiles (canonical: EventPage)

---

## 2. Core Architectural Rules (Locked)

### Canonical Event Model

- Canonical event = `EventPageData`
- Event ID = `EventPageData.id`
- Homepage references **EventPage only**

```ts
type HomeEventRef = {
  kind: 'eventRef'
  eventPageId: string
  size?: 'S' | 'M' | 'L'
}
```

### Forbidden (Strict)

- No `EventData`
- No `useEvent()`
- No `/api/public/events`
- No `events/catalog.json`
- No `Feature on Home`
- No block-level homepage composition

---

## 3. Homepage Composition Model

```ts
type HomeItem =
  | HomeStreamRef
  | HomeEventRef
  | HomeBlockRef // legacy (read-only)
```

### Composition Units

- streamRef
- eventRef (EventPage only)
- blocks are NOT exposed in editor UI

---

## 4. Data Model Rules

### StreamRef Transition

- Backend accepts:
  - `streamSlug`
  - `streamId`
- Frontend writes:
  - `streamId` only

### Rule

- read-tolerant
- write-canonical
- no migration script

---

## 5. Migration Rules (v1)

### eventRef Validation

Decision tree:

1. `{ eventPageId }` exists and resolves → valid
2. `{ eventPageId }` missing in catalog → orphan → Remove only
3. `{ eventId }` legacy:
   - single match → Convert
   - none/multiple → Remove only
4. invalid shape → Remove only

### blockRef Handling

- `eventCta`:
  - matching EventPage → Convert
  - otherwise → Remove
- other blocks → Remove only

---

## 6. Orphan Handling

### Definition

Item is orphan if reference does not resolve.

### Admin UI

- Render `OrphanTileAdmin`
- Show:
  - "Missing — <id>"
- Actions:
  - Remove only

### Save Behavior

- Save NOT blocked
- Banner warning shown

### Public

- Orphans silently skipped

---

## 7. Editor Behavior

### Editor Type

- Singleton
- Edit-only
- No select mode

### Capabilities

- Add stream
- Add event
- Reorder
- Remove
- Open item

---

## 8. Journey Integration

### Add Stream

homeInsertStream → stream editor (select) → return { id }

### Add Event

homeInsertEvent → eventPage editor (select) → return { id }

### Open Item

- openStreamItem → stream editor
- openEventItem → eventPage editor

---

## 9. Return Behavior

- Editor re-mounts on return
- Scroll NOT preserved (accepted v1 limitation)
- Draft state preserved

---

## 10. EventPage Loading (Critical)

- useHomeFeed calls loadEventPagesOnce() at mount
- Homepage does not render event tiles before load completes
- On failure:
  - stream tiles render
  - event tiles skipped

---

## 11. Phase 1 Gate

Must verify:

- stream editor supports select + return

Fallback (temporary):

- inline picker allowed ONLY if Journey path unavailable

---

## 12. Anti-Regression Invariant

No new code may reference:

- EventData
- useEvent()
- events/catalog.json
- /api/public/events

Enforced by:

- ESLint rule
- PR checklist
- unit test

---

## 13. Rollout Plan

Phase 0 — reset
Phase 1 — stream select gate
Phase 2 — data model
Phase 3 — editor shell
Phase 4 — migration UI
Phase 5 — route switch
Phase 6 — cleanup legacy

---

## 14. Final Product Behavior

Editor workflow:

1. Open Homepage Editor
2. Add stream/event via Journey
3. Reorder tiles
4. Drill into items
5. Return
6. Save

No shortcuts, no legacy paths.
