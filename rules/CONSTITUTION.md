# SashaGallery — Architecture Constitution (v3)

> This document is the "architecture contract" for SashaGallery.  
> Any new feature must converge toward this contract (no ad-hoc bypasses).

## 1. Purpose
- Preserve architectural integrity and prevent "drift" (especially when using coding agents).
- Define the domain model, core mechanisms, and canonical user workflows.
- Provide a concrete checklist for evaluating changes.

## 2. Layers
**Layering**
```
app → features → entities
         ↓
       shared
```

**Dependency rule (MUST):**
- Dependencies go *downward only*.
- `entities/` must not depend on React/UI, routing, or `features/`.
- `shared/` must not become a feature-specific dumping ground.

## 3. Domain Model

### 3.1 Entities (finite and controlled)
Adding a new entity requires an explicit decision (ADR).

- **ArtItem** — catalog item with metadata + media references.
- **Block** — universal content container. Can contain:
  - ArtItem references (gallery slots),
  - Event embeds,
  - Text content (story block),
  - Optional background (ArtItem reference).
- **Stream** — narrative composition of Blocks.
- **Event** — preset-based event record (workshop, plein-air, exhibition, minimal), authored via the Event Editor at `/admin/event-pages`. Holds its own enrollments. In-code type: `EventPageData`. Specialized by `invariant--architecture--single-event-entity.md` — exactly one representation, no parallel model. See `decision--event--event-page-is-canonical-event.md`.
- **HomeDoc (singleton)** — site portrait composed of HomeItems.

### 3.2 Non-entities
- **Hopper** — pipeline/staging for media ingestion (not a domain entity).
- **HomeItem** — a data structure inside HomePage (not an entity unless decided later).
- Internal block sub-structures (e.g., text payload) are parts of Block, not standalone entities.

## 4. Core Mechanisms

### 4.1 Journey (cross-editor navigation protocol)
- All cross-editor flows with return + result MUST use Journey (no bypass via ad-hoc navigation).
- Journey supports deep nesting and can start from *any* editor.

**UI guards (MUST):**
- While Journey is active, global/header navigation and burger menu routes are disabled
  (or guarded so the user cannot accidentally break the journey).

**Save vs Apply semantics (MUST):**
- **Save**: persist current entity, remain in editor (no journey advancement).
- **Apply**: complete the current journey leg, persist (if needed), return to caller with result.

### 4.2 Editor Contexts (control plane)
- Context/provider is the editor's control plane: CRUD orchestration, bootstrap, guards, handlers.
- Components are view plane: render + call handlers.

**Bootstrap rule (MUST):**
- During mount/bootstrap, read external stores *directly* (imperative read), not via hooks.
  Hooks may reflect correct values only after subsequent render cycles.

### 4.3 External Stores (data plane)
- External stores hold persistent/cross-screen state (Journey stack, global lists, sessions, etc.).
- Contexts decide what to do; stores hold what we know.
- Avoid "god-context" that owns global data as the primary source of truth.

### 4.4 Dual Editor Mode Pattern
Every editor follows two modes (except Hopper):
- **Select Mode**: grid of thumbnails for the entity (plus templates where applicable).
- **Single Item Edit Mode**: focused editor for one item + metadata.

**Filtering (To-Be / partial):**
- Select Mode supports filtering by entity metadata (tags, technique, block layout, etc.).
- Filtering produces a derived view and must not mutate source-of-truth data.

### 4.5 Unified Rendering Model (To-Be)
- Introduce a unified `Frame + Renderable` model to render Blocks/Streams/ArtItems consistently.
- Appearance becomes data-driven and user-editable (Blocks and Stream thumbnails).

### 4.6 Standard Command Surfaces
- **SingleEditorToolbar**: primary actions; must be consistent across editors.
- **Three-Dot Menu**: secondary actions for list items (Stream blocks, Home items, etc.).

### 4.7 Public UX: Quick View → Full View (To-Be)
**Goal:** avoid instant “teleport to full screen” on the first click; show metadata first.

**Behavior:**
1) First click on an ArtItem preview opens a **Quick View panel** (popover/card) near the click:
   - key metadata: title, technique/materials, size, availability, price (if applicable),
   - primary CTA: **View details / Full view**,
   - optional CTA (future): **Request to buy / Reserve / Contact**.
2) Only after explicit CTA do we open **Full View** (prefer same tab with a proper return).
3) Closing Full View returns to the previous context (Home/Stream) as seamlessly as possible.

## 5. Backend & Storage
- **JSON vault** is source-of-truth for domain structures.
- **Filesystem media** for originals/previews/derivatives.
- **FastAPI REST API** provides the contract used by the frontend.
- Backend uses locking/session discipline to avoid conflicting writes (even in single-user setups).

## 6. Canonical Workflows (system contracts)
Unit workflows:
- WF-A: ArtItem ingestion — Hopper → Catalog
- WF-B: Event create/edit — standalone
- WF-C: Block create/edit — ArtItem slots / Event embeds / Text blocks (+ optional background)
- WF-D: Stream create/edit — composition of Blocks
- WF-E: HomeDoc compose — HomeItems referencing Streams/Blocks

Composite workflows:
- WF-J1: Nested Journey — may start from any editor; supports deep chaining and return.

## 7. Current Priorities
1) Bring the codebase back into compliance with this Constitution.
2) Define the responsive public rendering rules for Home items (grid columns, sizing, breakpoints).
3) Implement the HomeDoc model (HomeItems referencing Streams/Blocks).
4) To-Be features:
   - Unified toolbar behavior across editors
   - Working filtering in Select Mode
   - Custom appearance (Blocks + Stream thumbnails)
   - Quick View panel on public pages

## 8. Global Rules

**MUST**
- Use Journey for cross-editor navigation with return/result.
- Keep editor logic in Contexts; keep persistent data in External Stores.
- Converge toward unified rendering (Frame + Renderable) when touching rendering code.

**MUST NOT**
- Bypass Journey with ad-hoc routing/returnTo/query params.
- Duplicate domain models/types across layers.
- Introduce new rendering paths that ignore the unified rendering direction.
