# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**atSashas.Gallery** — a modular art gallery system with a public gallery and admin dashboard in a single React frontend, backed by a FastAPI REST API. Data is stored as JSON files in a `vault/` directory (no database).

## Build & Dev Commands

### Frontend (`apps/frontend/`)

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b && vite build (type-check + production build)
npm run type-check   # tsc --noEmit (types only, no output)
npm run lint         # ESLint with --max-warnings=0 (zero tolerance)
npm run format       # Prettier --write
npm run preview      # Preview production build locally
```

### Backend (`apps/admin-backend/`)

```bash
poetry install                              # Install dependencies
poetry run uvicorn app.main:app --reload    # Run FastAPI dev server
```

### Docker (full stack)

```bash
cd docker && docker compose up --build
# Caddy proxies: / → frontend, /api/* → backend
```

## Architecture

### Monorepo Layout

- `apps/frontend/` — React 19 + Vite + TypeScript (public site + `/admin` section)
- `apps/admin-backend/` — FastAPI + Poetry (uploads, JSON CRUD)
- `docker/` — Docker Compose + Caddy reverse proxy
- `vault/` — JSON catalogs + media assets (binary images gitignored)
- `Docs/` — PROJECT_CONTEXT.md, agreements.md (reference material)

### Frontend Structure (`apps/frontend/src/`)

Organized by **Feature-Sliced Design** (entities → features → pages):

- **`entities/`** — Pure domain models and types (no UI). Key domains: `art/` (ArtItem), `block/` (Gallery|Text|Cta blocks), `stream/` (ordered block sequences), `catalog/`, `hopper/`, `common/` (Lifecycle, Localized, Money, Dimensions)
- **`features/`** — Business logic scoped to domains:
    - `features/admin/blocks/` — Block editor (session, context, API, validation)
    - `features/admin/streams/` — Stream editor
    - `features/admin/catalogEditor/` — Art catalog editor (WIP)
    - `features/public/` — Public gallery rendering (GalleryBlock, hooks, API)
- **`shared/`** — Universal utilities: `state/` (BaseStore, EditSessionsDataStore), `nav/` (Journey/Transporter pattern), `lib/` (checkers, id generation, theme), `ui/` (toolbar, menus, lightbox), `galleryLayouts/`
- **`pages/`** — Route leaf components (admin/ and public/)
- **`app/`** — Router, providers, layouts, entry point

### Path Aliases

```
@/ → ./src    @/features → ./src/features    @/entities → ./src/entities    @/shared → ./src/shared
```

### Routing (`src/app/router.tsx`)

- `/` `/gallery` `/about` — Public pages (wrapped in ArtCatalogLoader)
- `/admin` `/admin/streams` `/admin/blocks` `/admin/catalog` `/admin/upload` — Admin pages (wrapped in EditorWorkspaceProvider)
- All pages are lazy-loaded with `React.lazy()`

### Key Patterns

**Journey/Transporter** — Multi-step editor workflows use a ticket-based navigation stack (`shared/nav/`). Editors dispatch `JourneyTicket` objects to navigate between Stream → Block → Catalog → Hopper, carrying return effects and loot. Key hooks: `useDispatch()`, `useReturnHome()`, `useArrival()`, `usePeekTicket()`.

**Editor Sessions** — Each editor (Block, Stream, Catalog) has its own context provider wrapping the route. State managed via `EditSessionsDataStore` (custom pub/sub store tracking draft/snapshot per `EditorKey`). Pattern: bootstrap → edit (mode stack) → validate → normalize → persist via API → return journey.

**Context Provider Convention** — Create context with `undefined` default, expose via `useFeature()` hook that throws if used outside provider.

**Entity Classes** — Domain models in `entities/` use class-based pattern with `static fromJSON()`, `toJSON()`, and constructor validation (e.g., `ArtItem.validateBasic()`).

### Backend API Endpoints

- `GET/POST /api/json/art_catalog` — Full catalog read/write
- `GET/PUT/POST/DELETE /api/blocks/*` — Block CRUD + collections
- `GET/POST/PUT/DELETE /api/streams/*` — Stream CRUD
- `POST /api/upload`, `GET /api/files` — Hopper file management

### Environment Variables (frontend `.env`)

```
VITE_API_BASE_URL=/api
VITE_VAULT_BASE_URL=/media
VITE_STREAMS_BASE_URL=/media/streams
```

## Code Style

- **TypeScript strict mode** with `noUncheckedIndexedAccess: true`
- **Prettier**: single quotes, trailing commas, 100 char width, semicolons
- **ESLint**: flat config (v9), `simple-import-sort` enforces import ordering (external → @/ paths → relative)
- **CSS**: Plain CSS files co-located with components (`Component.css`)
- **React**: Functional components only, hooks only
- **Naming**: PascalCase components, camelCase functions, `*.types.ts` for type files, `use*.ts` for hooks

## Domain Model Quick Reference

- **Block** = discriminated union (`blockKind: 'gallery' | 'text' | 'cta'`). Gallery blocks arrange art items in layouts (single, pair, triptych variants). Text blocks have variants (full/narrow/quote). CTA blocks have button targets.
- **Stream** = ordered list of block IDs with metadata and status (`draft | ready | archived | published`)
- **ArtItem** = artwork with localized title/alt, techniques, dimensions, price, availability, image derivatives
- **Localized** = `Partial<Record<'en'|'ru'|'it'|'es'|'pt', string>>`
- **EntityLifecycle** = `'template' | 'draft' | 'saved' | 'published'`

# SashaGallery — Architecture Constitution

This document defines **non-negotiable architectural rules**.
All implementations MUST follow these rules.

---

## 1. Core Principle

The system is built as a **strict layered architecture**:

app → features → entities  
 ↓  
 shared

Rules:

- No upward dependencies
- No cross-layer violations
- No business logic in UI components

---

## 2. Domain Model (Strict)

Allowed entities ONLY:

- ArtItem
- Block
- Stream
- Event
- HomeDoc

Rules:

- No new entities without explicit justification
- No “hidden entities” inside components
- Hopper is NOT an entity (pipeline stage only)
- HomeItems are NOT entities (data structures only)

---

## 3. Editor Architecture

Each editor MUST follow:

### 3.1 Dual Mode

- Select Mode → grid of thumbnails
- Edit Mode → single item editor

### 3.2 Context = Control Plane

Context responsibilities:

- CRUD logic
- user action handling
- Journey integration
- bootstrap logic

### 3.3 UI = Render Only

Components:

- MUST NOT contain business logic
- MUST receive data via props

---

## 4. Journey (Mandatory Navigation Mechanism)

All cross-editor workflows MUST use Journey.

Rules:

- One Journey = one Ticket
- Ticket is stored in an **external store (NOT React)**
- Ticket grows with segments during navigation
- Editors bootstrap from Ticket

Restrictions:

- Direct navigation (router/header) is DISABLED during active Journey
- Navigation must be guarded

Actions:

- `Save` → persist only
- `Apply` → complete Journey step and return result

📌 BEFORE modifying navigation:
→ READ: `rules/ADR-001-journey-navigation.md`

---

## 5. External Stores (Data Plane)

Rules:

- All shared/stateful data MUST live in external stores
- Context = logic, Store = data
- No global data inside React Contexts

Bootstrap rule:

- During mount/bootstrap → access stores directly (NOT via hooks)

---

## 6. Rendering Model (Unified System — REQUIRED DIRECTION)

Rendering MUST evolve toward:

- Frame (layout container)
- Renderable (block/stream/artItem)

Rules:

- No ad-hoc rendering logic per component
- Rendering must be consistent across app
- Appearance must be configurable

📌 BEFORE modifying rendering:
→ READ: `rules/ADR-004-rendering-system.md`

---

## 7. Standard UI Mechanisms

Allowed action surfaces:

- SingleEditorToolbar (primary actions)
- ThreeDotMenu (secondary actions)

Rules:

- No custom scattered action buttons
- All actions must go through standard mechanisms

---

## 8. Filtering (Select Mode)

Rules:

- Filtering MUST NOT mutate source data
- Filtering is always a derived view
- Must work consistently across all editors

---

## 9. Backend Rules

- Source of truth = JSON storage
- Media = filesystem
- Backend = FastAPI REST API

Rules:

- All writes must be controlled (locking/session discipline)
- No uncontrolled concurrent modifications

---

## 10. Workflow Model (Canonical)

Hopper → ArtItem → Block → Stream → HomeDoc → Publish

Rules:

- No shortcuts bypassing this pipeline
- All UI must respect this flow

---

## 11. Public UX (Upcoming — MUST FOLLOW)

### Quick View Behavior

- First click → opens metadata panel (NOT full screen)
- Panel includes:
    - metadata
    - preview button
    - future purchase action

- Full screen opens ONLY via explicit action

---

## 12. When ADRs MUST be consulted

Before implementing or modifying:

### Navigation / Editor transitions

→ `rules/ADR-001-journey-navigation.md`

### Editor logic / Context behavior

→ `rules/ADR-002-editor-context.md`

### Store usage / state architecture

→ `rules/ADR-003-external-store.md`

### Rendering / layout / appearance

→ `rules/ADR-004-rendering-system.md`

---

## 13. Absolute Restrictions

DO NOT:

- bypass Journey with direct navigation
- store global data in React Context
- introduce new entities without justification
- mix rendering logic with business logic
- implement one-off UI patterns outside standard systems

---

## 14. Priority Direction

Current focus:

1. Restore architecture compliance
2. Implement HomeDoc model
3. Define rendering rules (grid + responsiveness)
4. Unify toolbar system
5. Complete filtering
6. Implement appearance customization
