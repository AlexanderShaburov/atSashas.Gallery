---
type: spec
scope: [system, api]
status: active
date: 2026-04-10
source_of_truth: false
tags: [auth, behavior]
---

# Authentication behavior

## Login flow

1. User submits username/password on LoginPage
2. `POST /auth/login` → verify bcrypt password
3. Backend creates JWT (HS256), stores session in SessionStore, sets HTTP-only cookie
4. Frontend receives 200, AuthProvider updates state (isAuthenticated = true)
5. RequireAuth allows access to admin routes

## Session validation (every authenticated request)

1. `get_current_user()` dependency extracts `session_token` cookie
2. Validates session exists in SessionStore
3. Checks activity timeout (last_activity vs now)
4. Verifies JWT signature and expiry
5. Loads user from UserRepository
6. Updates `last_activity` timestamp
7. Returns User (or raises 401)

## Single session enforcement

New login invalidates any existing session for the same user. Only one active session per username.

## Frontend mount check

AuthProvider calls `GET /auth/me` on mount to check existing session cookie. If valid → `isAuthenticated = true`. If 401 → `isAuthenticated = false`.

## RequireAuth guard

Checks `isAuthenticated`. If false → redirect to `/admin/login` with saved location for post-login redirect. If loading → shows "Loading...".

## Legacy admin token

`require_admin_token()` in `deps.py` currently returns hardcoded `"dev-admin"`. Applied to `/upload` POST and `/art/catalog/update` POST alongside session auth.

## Session-expiry detection (frontend)

Session validity is **not** a one-time check. The frontend keeps its
view of authentication honest through three signals, all consumed by
`AuthProvider`:

1. **`apiFetch` interceptor** — every admin API module routes its
   `fetch` calls through `features/auth/apiFetch.ts`. On a 401 or
   403 response, the wrapper calls `notifySessionExpired()` on
   `features/auth/sessionBus.ts`. The bus has a single consumer
   (AuthProvider) which marks the session expired and triggers a
   re-render.
2. **Heartbeat** — `AuthProvider` polls `/auth/me` every 60 s while
   authenticated. A null reply marks the session expired.
3. **`visibilitychange`** — when a backgrounded admin tab returns to
   visible, AuthProvider re-checks `/auth/me` immediately so the
   next click doesn't run into a stale 401.

When any of the three triggers fires, `AuthProvider` flips
`isAuthenticated` to `false`, sets a `sessionExpired` flag on its
state, and `RequireAuth` redirects to `/admin/login` on the next
render. The login page reads `sessionExpired` and renders a clear
"Your session expired" notice so the admin understands why they
were redirected. The flag clears on the next successful `login()`.

Public-side and upload-module fetches are intentionally not routed
through `apiFetch`: public read endpoints are unauthenticated, and
the upload path uses the legacy admin-token header rather than the
session cookie.

See `bug--auth--silent-session-expiry-zombie-state.md` for the
prior failure mode this design replaces.

## Related

- [Auth structure](../architecture/architecture--system--authentication.md)
- `bug--auth--silent-session-expiry-zombie-state.md`
