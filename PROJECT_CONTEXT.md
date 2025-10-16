# Project Context — atSashas.Gallery

## 1. Overview

**atSashas.Gallery** is a modular system composed of:

-   **Public Frontend** — React/Vite/TypeScript single-page site showcasing Sasha’s artworks.
-   **Admin Interface** — implemented as a dedicated section/page within the same frontend (route `/admin`), not as a separate project.
-   **Admin Backend (FastAPI)** — REST API for uploads, JSON data operations, and internal service tasks.
-   **Infrastructure (in `/docker`)** — Caddy reverse proxy, Docker Compose, and environment configuration.
-   **Data Storage (`vault/`)** — JSON-based catalogs for `arts`, `letters`, `streams`, and related assets.

**Current status:**  
The public frontend and backend are functional; Docker environment is stable and integrated;  
Caddy handles routing; JSON catalogs are read/written successfully.

---

## 2. Repository Structure

```bash
SashaGallery/
┣ .vscode/
┃ ┣ launch.json
┃ ┣ settings.json
┃ ┗ tasks.json
┣ apps/
┃ ┣ admin-backend/ # FastAPI (Poetry) — upload & JSON management endpoints
┃ ┣ frontend/ # React/Vite/TypeScript — public site + /admin section
┃ ┗ sasha-gallery-js.bak/ # backup of the old JS version
┣ docker/
┃ ┣ .env # environment variables for docker-compose
┃ ┣ Caddyfile.dev # reverse proxy/static setup for development
┃ ┗ docker-compose.yml # frontend + backend + Caddy stack
┣ vault/
┃ ┣ arts/
┃ ┣ letters/
┃ ┣ streams/
┃ ┗ .gitkeep
┣ .editorconfig
┗ .gitignore
```

**Important:**  
The **Admin Frontend** lives **inside** `apps/frontend`, not as a separate container or project.  
Its UI is structured as a multi-step flow (upload → select/filter → blocks/layout) under `/admin`.

---

## 3. Admin Interface Logic (within Frontend)

### Step 1: Upload

-   Upload local files to the backend “hopper” (temporary folder).
-   Display list of uploaded files and their processing statuses.

### Step 2: Select / Preview

-   Apply filters (tags, techniques, dates, etc.).
-   Preview artworks dynamically, adjust filtering criteria on the fly.

### Step 3: Blocks / Layout

-   Drag-and-drop images into layout blocks.
-   Choose layout type/grid, assign captions and metadata.
-   Save resulting configurations into structured JSON (catalogs/streams).

---

## 4. Admin Backend (FastAPI)

### Core Endpoints

| Method | Endpoint           | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| `POST` | `/api/upload`      | Uploads files into the “hopper”.                         |
| `GET`  | `/api/files`       | Returns list of uploaded or catalogued files.            |
| `GET`  | `/api/json/{kind}` | Reads JSON data from `vault/` (e.g., `streams`, `arts`). |
| `POST` | `/api/json/{kind}` | Writes or updates JSON data.                             |

### Features

-   Pydantic models define and validate data structures (`streams`, `items`, `tags`, `techniques`, etc.).
-   Vault paths and environment variables are configurable via `.env`.

---

## 5. Vault and Git Policy

-   Keep **folder structure and JSON files** in Git.
-   Exclude **binary image assets** (optional but recommended).
-   Example `.gitignore` fragment:

    ```gitignore
    /vault/**
    !/vault/**/
    !/vault/**/*.json
    !/vault/**/.gitkeep
    .gitkeep ensures the folder structure remains in the repository even when empty.
    ```

6. Docker & Caddy (in /docker)
   Composition
   docker/docker-compose.yml launches:
   frontend — Vite dev server or built static files
   admin-backend — FastAPI + Uvicorn
   Caddy — reverse proxy and static file server
   Routing (from Caddyfile.dev)
   / → frontend (SPA)
   /admin → same frontend (SPA routing)
   /api/\* → admin-backend
   Environment (.env)
   Stores:
   BACKEND_URL, VAULT_PATH, port mappings, and other environment values.
   Example startup
   cd docker
   docker compose up --build
7. Tech Stack Summary
   Layer Technology
   Frontend React, Vite, TypeScript, CSS Modules
   Admin UI In-app pages/components under /admin, with drag-and-drop features
   Backend FastAPI, Pydantic, Poetry
   Infrastructure Docker, Caddy, .env-based config
   Data JSON catalogs + media files stored in vault/
8. Current “Ready” State
   ✅ Public frontend — operational
   ✅ Admin backend — API responds (/admin/api/... routes active)
   ✅ Docker environment — stable
   ✅ Caddy — proxy and SPA routing configured
   ✅ Repository structure — finalized as per above layout
9. Immediate Next Steps (Practical Checklist)
   Admin UI (3-step process)
   Build pages and routes: /admin/upload, /admin/select, /admin/blocks
   Implement drag-and-drop and JSON-based layout persistence
   API Contracts
   Finalize JSON schemas for streams, items, tags, techniques
   Define and enforce Pydantic models
   Add validation and error reporting
   Vault Paths
   Centralized configuration through .env
   Frontend retrieves path info via API
   Admin Authorization
   Add token/basic auth protection for /admin and /api/\*
   Documentation
   Add concise README.md files for:
   apps/admin-backend (FastAPI service)
   apps/frontend (React/Vite setup)
   Both should describe local and Docker-based startup.
10. Summary for New Contributors / Fresh Chat Context
    Frontend (React) hosts both the public gallery and /admin interface — not a separate app.
    Backend — FastAPI-based REST API.
    Infrastructure — Docker Compose + Caddy for routing and reverse proxy.
    Data — stored in vault/ as JSON catalogs and associated files.
    Current Objective — complete the 3-step admin workflow (upload → select → blocks) and finalize JSON schema definitions.
