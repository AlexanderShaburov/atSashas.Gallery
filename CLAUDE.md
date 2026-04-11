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
poetry install
poetry run uvicorn app.main:app --reload
```

### Docker (full stack)

```bash
cd docker && docker compose up --build
```

## Architecture

### Monorepo Layout

* `apps/frontend/` — React 19 + Vite + TypeScript (public site + `/admin` section)
* `apps/admin-backend/` — FastAPI + Poetry (uploads, JSON CRUD)
* `docker/` — Docker Compose + Caddy reverse proxy
* `vault/` — JSON catalogs + media assets
* `Docs/` — project context, agreements, communication logs, reference material
* `knowledge/` — architecture knowledge base / memory layer

### Frontend Structure (`apps/frontend/src/`)

Organized by **Feature-Sliced Design** (entities → features → pages):

* **`entities/`** — Pure domain models and types (no UI)
* **`features/`** — Business logic scoped to domains
* **`shared/`** — Universal utilities and cross-cutting systems
* **`pages/`** — Route leaf components
* **`app/`** — Router, providers, layouts, entry point

### Path Aliases

```text
@/ → ./src
@/features → ./src/features
@/entities → ./src/entities
@/shared → ./src/shared
```

### Routing (`src/app/router.tsx`)

* `/` `/gallery` `/about` — Public pages
* `/admin` `/admin/streams` `/admin/blocks` `/admin/catalog` `/admin/upload` — Admin pages
* All pages are lazy-loaded with `React.lazy()`

### Key Patterns

**Journey/Transporter** — Multi-step editor workflows use a ticket-based navigation stack (`shared/nav/`). Editors dispatch `JourneyTicket` objects to navigate between Stream → Block → Catalog → Hopper, carrying return effects and loot.

**Editor Sessions** — Each editor has its own context provider wrapping the route. State is managed via `EditSessionsDataStore`. Pattern: bootstrap → edit → validate → normalize → persist via API → return journey.

**Context Provider Convention** — Create context with `undefined` default and expose it via a hook that throws if used outside its provider.

**Entity Classes** — Domain models in `entities/` use class-based pattern with `static fromJSON()`, `toJSON()`, and constructor validation.

### Backend API Endpoints

* `GET/POST /api/json/art_catalog`
* `GET/PUT/POST/DELETE /api/blocks/*`
* `GET/POST/PUT/DELETE /api/streams/*`
* `POST /api/upload`, `GET /api/files`

### Environment Variables (frontend `.env`)

```bash
VITE_API_BASE_URL=/api
VITE_VAULT_BASE_URL=/media
VITE_STREAMS_BASE_URL=/media/streams
```

## Code Style

* **TypeScript strict mode** with `noUncheckedIndexedAccess: true`
* **Prettier**: single quotes, trailing commas, 100 char width, semicolons
* **ESLint**: flat config (v9), `simple-import-sort` enforces import ordering
* **CSS**: Plain CSS files co-located with components
* **React**: Functional components only, hooks only
* **Naming**: PascalCase components, camelCase functions, `*.types.ts` for type files, `use*.ts` for hooks

## Domain Model Quick Reference

* **Block** = discriminated union (`blockKind: 'gallery' | 'text' | 'cta'`)
* **Stream** = ordered list of block IDs with metadata and status (`draft | ready | archived | published`)
* **ArtItem** = artwork with localized title/alt, techniques, dimensions, price, availability, image derivatives
* **Localized** = `Partial<Record<'en'|'ru'|'it'|'es'|'pt', string>>`
* **EntityLifecycle** = `'template' | 'draft' | 'saved' | 'published'`

---

# SashaGallery — Architecture Constitution

This document defines **non-negotiable architectural rules**.
All implementations MUST follow these rules.

## 1. Core Principle

The system is built as a **strict layered architecture**:

```text
app → features → entities
 ↓
shared
```

Rules:

* No upward dependencies
* No cross-layer violations
* No business logic in UI components

## 2. Domain Model (Strict)

Allowed entities ONLY:

* ArtItem
* Block
* Stream
* Event
* HomeDoc

Rules:

* No new entities without explicit justification
* No hidden entities inside components
* Hopper is NOT an entity
* HomeItems are NOT entities

## 3. Editor Architecture

Each editor MUST follow:

### 3.1 Dual Mode

* Select Mode → grid of thumbnails
* Edit Mode → single item editor

### 3.2 Context = Control Plane

Context responsibilities:

* CRUD logic
* user action handling
* Journey integration
* bootstrap logic

### 3.3 UI = Render Only

Components:

* MUST NOT contain business logic
* MUST receive data via props

## 4. Journey (Mandatory Navigation Mechanism)

All cross-editor workflows MUST use Journey.

Rules:

* One Journey = one Ticket
* Ticket is stored in an **external store (NOT React)**
* Ticket grows with segments during navigation
* Editors bootstrap from Ticket

Restrictions:

* Direct navigation (router/header) is DISABLED during active Journey
* Navigation must be guarded

Actions:

* `Save` → persist only
* `Apply` → complete Journey step and return result

📌 BEFORE modifying navigation:
→ READ: `rules/ADR-001-journey-navigation.md`

## 5. External Stores (Data Plane)

Rules:

* All shared/stateful data MUST live in external stores
* Context = logic, Store = data
* No global data inside React Contexts

Bootstrap rule:

* During mount/bootstrap → access stores directly (NOT via hooks)

## 6. Rendering Model (Unified System — Required Direction)

Rendering MUST evolve toward:

* Frame (layout container)
* Renderable (block/stream/artItem)

Rules:

* No ad-hoc rendering logic per component
* Rendering must be consistent across app
* Appearance must be configurable

📌 BEFORE modifying rendering:
→ READ: `rules/ADR-004-rendering-system.md`

## 7. Standard UI Mechanisms

Allowed action surfaces:

* SingleEditorToolbar
* ThreeDotMenu

Rules:

* No custom scattered action buttons
* All actions must go through standard mechanisms

## 8. Filtering (Select Mode)

Rules:

* Filtering MUST NOT mutate source data
* Filtering is always a derived view
* Must work consistently across all editors

## 9. Backend Rules

* Source of truth = JSON storage
* Media = filesystem
* Backend = FastAPI REST API

Rules:

* All writes must be controlled
* No uncontrolled concurrent modifications

## 10. Workflow Model (Canonical)

```text
Hopper → ArtItem → Block → Stream → HomeDoc → Publish
```

Rules:

* No shortcuts bypassing this pipeline
* All UI must respect this flow

## 11. Public UX (Upcoming — Must Follow)

### Quick View Behavior

* First click → opens metadata panel
* Panel includes:

  * metadata
  * preview button
  * future purchase action
* Full screen opens ONLY via explicit action

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

## 13. Absolute Restrictions

DO NOT:

* bypass Journey with direct navigation
* store global data in React Context
* introduce new entities without justification
* mix rendering logic with business logic
* implement one-off UI patterns outside standard systems

## 14. Priority Direction

Current focus:

1. Restore architecture compliance
2. Implement HomeDoc model
3. Define rendering rules
4. Unify toolbar system
5. Complete filtering
6. Implement appearance customization

---

# Knowledge Vault (Agent Memory Layer)

## 1. Location

Knowledge base is stored in:

```text
./knowledge/
```

Project memory may also exist in dedicated progress or memory documents outside `knowledge/`.

## 2. Reading strategy (at session start)

1. Read `knowledge/index/*`
2. Identify the relevant scope
3. Load only relevant documents
4. Prefer source-of-truth docs first:

   * invariants
   * architecture
   * decisions
   * patterns
   * specs

## 3. During work

Agent must follow, in this priority order:

1. invariants
2. architecture
3. decisions
4. patterns
5. specs

If code, behavior, or task instructions contradict the knowledge base, resolve the contradiction explicitly rather than silently ignoring it.

## 4. Knowledge categories

When new durable project knowledge appears, persist it in `knowledge/` using the correct type:

* **invariant** → strict rule that must always hold
* **decision** → why something was chosen
* **architecture** → structural/system truth
* **spec** → feature behavior or requirements
* **bug** → issue, cause, and resolution
* **pattern** → reusable solution
* **glossary** → stable terminology
* **open-question** → unresolved design or implementation question
* **session** → session-level summary only when explicitly requested

## 5. What counts as a knowledge-impacting change

A task MUST be treated as knowledge-impacting if it changes any of the following:

* architecture or layering
* domain model or entity shape
* route structure or editor entry points
* editor modes, workflow, or Journey behavior
* persistence behavior or API contract
* rendering rules or presentation contract
* validation rules
* admin UI structure that affects system understanding
* bug behavior that required discovering root cause or introducing a durable fix
* implementation progress/state tracked in project memory documents

Bug fixes are **not exempt**.

## 6. Mandatory knowledge sync after implementation work

After completing any non-trivial task, especially code work, the agent MUST perform a **knowledge sync check** before considering the task complete.

The agent MUST ask:

1. What changed in code, behavior, structure, or project state?
2. Does any existing knowledge document become stale because of this?
3. Do any memory/progress documents need to be updated?
4. Is a new knowledge document required, or is an existing one enough?

If yes to any of the above, the agent MUST update the affected knowledge and/or memory files.

## 7. Task completion rule

A task is **NOT complete** until one of the following is true:

### A. Knowledge sync completed

The relevant knowledge and memory files were updated.

### B. Knowledge sync explicitly ruled out

The agent checked for knowledge impact and determined that no durable project knowledge changed.

Silently skipping this step is not allowed.

## 8. Update strategy

### 8.1 Prefer updating existing docs first

If the knowledge already has a natural home, update the existing file instead of creating duplicates.

### 8.2 Create new docs only when needed

Create a new file only when the information introduces a distinct durable concept that does not fit an existing document.

### 8.3 Update linked docs

If a changed fact affects related docs or indexes, update those too.

### 8.4 Update memory/progress docs

If implementation status, completion stage, constraints, or next steps changed, update the relevant progress or memory file as well.

## 9. Required end-of-task reporting

At the end of any substantial task, the agent MUST report one of these two outcomes:

### Outcome 1 — Knowledge updated

List the exact files updated and what changed.

### Outcome 2 — No knowledge update needed

State explicitly that knowledge sync was checked and no durable knowledge changed.

Do not use vague phrases like:

* “handled implicitly”
* “reflected in logic”
* “covered by the code”
* “no documentation changes for now”

## 10. Naming rules

All files MUST follow:

```text
<type>--<scope>--<statement>.md
```

Examples:

```text
invariant--navigation--all-cross-editor-flows-use-journey.md
decision--architecture--use-feature-sliced-design.md
```

## 11. Scopes

Use ONLY allowed scopes.

Rules:

* 1–2 scopes maximum
* must come from the canonical project scope list
* use the narrowest accurate scope

## 12. Frontmatter (required)

Each knowledge document MUST include:

```yaml
---
type:
scope:
status:
date:
source_of_truth:
tags:
---
```

## 13. General vault rules

* One concept per file
* No generic names
* No temporary scratch notes inside `knowledge/`
* Documents must be linked where relevant
* Existing source-of-truth files must be corrected when they become stale
* If a document contains a fact that is no longer true, updating that document has priority over creating a new one

## 14. Relationship between code and knowledge

Code changes do not automatically update the knowledge base.

After implementation work, the agent MUST explicitly synchronize:

```text
code → knowledge → memory/progress → final report
```

`COMM.log` or conversational output does **not** count as knowledge persistence.

## 15. Session finalization

On explicit request only:

1. Create a session document
2. Extract:

   * decisions
   * invariants
   * bugs
3. Update index if needed

Do not treat ordinary implementation work as session finalization.

## 16. Practical rule of thumb

If a future agent reading only the knowledge base would make a wrong decision because the new information was not written down, then the knowledge base must be updated now.
