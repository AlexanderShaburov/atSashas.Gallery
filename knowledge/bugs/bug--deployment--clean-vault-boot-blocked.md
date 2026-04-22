---
type: bug
scope: [deployment, auth, catalog]
status: fixed
date: 2026-04-22
fixed_date: 2026-04-22
source_of_truth: true
tags: [deployment, docker, clean-deploy, vault, boot, backend, frontend]
---

# Clean deployment blocked when `vault/` is absent from the server

## Symptom

On a remote Docker deployment where `vault/` had intentionally not been
copied from local (it is excluded from Git and considered an out-of-band
artifact), the admin UI rendered a single blocking div:

> Art Catalog download error: The string did not match the expected pattern.

## Root cause — three compounding fragilities

1. **Backend crash at import** — `app/auth/repository.py` raised
   `FileNotFoundError` at module import when `vault/json/users.json` was
   missing. Because `user_repo = UserRepository()` was a module-level
   singleton, the whole FastAPI app failed to import and the admin
   container could not start. Caddy's `reverse_proxy admin-backend:8000`
   then returned 502 for every `/api/*`, cascading into the frontend's
   catalog fetch.
2. **Frontend catalog gate with no fallback** — `ArtCatalogLoader.tsx`
   treated any non-OK response from `/api/json/art_catalog` as a fatal
   blocking error, replacing every page with the error div. A legitimately
   missing `vault/json/art_catalog.json` (which the backend correctly
   reports as 404 via `json_kv.py`) was enough to block the entire app.
3. **Missing env fallback in the catalog loader** — alone among the API
   modules, `ArtCatalogLoader.tsx` read
   `import.meta.env.VITE_API_BASE_URL` without the `|| '/api'` fallback
   every other module uses. A server build that did not substitute the
   Vite env variable therefore produced a fetch URL of
   `undefined/json/art_catalog`. WebKit/Safari surfaces that specific
   malformed URL as "The string did not match the expected pattern" —
   the exact message the admin saw. Chrome/Firefox would have produced
   a different message.

Any one of the three triggers the symptom; the three together explain
the specific correlation with a missing vault.

## Fix

Small, targeted, preserves all existing behavior when `vault/` IS
present.

- **`apps/admin-backend/app/auth/repository.py`** — missing / malformed
  `users.json` now logs a warning and initializes an empty user dict.
  The backend stays up; login simply returns "invalid credentials" at
  the repository lookup.
- **`apps/frontend/src/shared/ArtCatalogProvider/ArtCatalogLoader.tsx`** —
  added `|| '/api'` fallback to `API_BASE` (matches every other module).
  A 404 response or a JSON-parse failure now logs a warning and proceeds
  with an empty catalog so the app boots. Genuine unexpected failures
  (non-404 non-OK, network errors) still surface as a blocking error so
  they don't go unnoticed.

No changes required to `app/storage.py` — it was already doing the
right thing (`JSON_DIR.mkdir(parents=True, exist_ok=True)` for
`json/`, `hopper/`, and `blocks/`). `UserRepository` was the outlier
that fought the existing idempotent-boot pattern.

## Clean-deploy contract (now enforced)

With `vault/` absent and no seed data, the system should boot and:

- Backend container starts (empty `json/`, `hopper/`, `blocks/` dirs
  are auto-created by `storage.py`). Admin endpoints respond; login
  returns "invalid credentials" until `users.json` is provisioned
  out-of-band.
- Frontend boots with an empty catalog. Public pages render with no
  arts; admin can log in (once `users.json` exists) and upload via the
  hopper. Uploaded arts populate the catalog and the empty-catalog
  fallback is no longer taken.
- Caddy routes `/media/*` at the empty vault; missing-image 404s are
  harmless.

## Verification

- Backend `pytest` — 73 passed, 2 skipped (unchanged; the existing test
  fixture seeds `users.json` so the happy path is still covered).
- Frontend `tsc --noEmit` clean; `vitest` — 540 passed.
- Manual browser verification against a clean deployment remains for
  the admin-side review.

## Related

- `decision--data--json-vault-no-database.md` — the JSON vault decision
  this bug class derives from
- `spec--system--authentication-behavior.md` — login flow unchanged by
  this fix (credentials simply fail at the repository lookup)
