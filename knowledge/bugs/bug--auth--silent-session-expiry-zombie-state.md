---
type: bug
scope: [auth, frontend]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [auth, session, expiry, ui, 401, interceptor, heartbeat]
---

# Silent session expiry leaves admin in a zombie authenticated state

## Symptom

After enough time passes for the backend session to expire (cookie
expiry or 30-minute activity timeout), the admin UI still presents
itself as authenticated:

- `RequireAuth` keeps allowing access to admin routes.
- The admin can click through editor flows and even type into forms.
- Backend mutations silently fail (the server returns 401, but the
  frontend treats failures as application errors or swallows them
  outright).
- Symptoms read like random product bugs: a block save that doesn't
  save, an image picker that returns empty, a customizer that never
  reflects the latest draft.

The user is never told their session expired. They keep working
into the void.

## Root cause

The frontend auth state was set **once at mount** and never re-checked.
Three concrete gaps in the previous design:

1. **No 401/403 interceptor.** Every admin API module called
   `fetch()` directly and threw a generic `Error` on `!res.ok`. None
   of them informed `AuthProvider` that a 401 had occurred.
2. **No heartbeat or visibility check.** `AuthProvider`'s
   `checkAuth()` ran exactly one `/auth/me` call at mount. After
   that, `isAuthenticated` was sticky `true` for the lifetime of the
   React tree.
3. **`RequireAuth` only redirects on `isAuthenticated` change.**
   Since nothing flipped that bit on a stale session, the route
   guard never triggered.

Per the auth architecture
(`architecture--system--authentication.md`), the backend correctly
returns 401 when a session is invalid; the failure was purely on the
frontend reactivity side.

## Fix — three layers

### 1. Session-expiry pub/sub bus

`features/auth/sessionBus.ts` — minimal `notifySessionExpired()` /
`onSessionExpired(fn)` pair. One producer interface, multiple
producers (apiFetch + heartbeat + visibility check), single
consumer (AuthProvider).

### 2. `apiFetch` — interceptor for 401/403

`features/auth/apiFetch.ts` — same signature as global `fetch`.
Only behavior change: on `401` or `403`, calls `notifySessionExpired()`
before returning the response. Callers continue to read the response
and surface their own application errors; the auth signal is
side-channel.

### 3. AuthProvider — heartbeat + visibility + bus subscription

`features/auth/authContext.tsx`:

- **Heartbeat** every 60 seconds while authenticated. Calls
  `getCurrentUser()`. If null → `markSessionExpired()`.
- **`visibilitychange` listener.** When the tab returns to visible,
  re-check immediately. Catches the "user backgrounded the tab for
  an hour" case in one round-trip.
- **`onSessionExpired` subscription.** Any admin API 401/403 flips
  the auth state instantly — well before the heartbeat would.
- **`sessionExpired: boolean` flag** added to the auth state.
  Survives the navigation to `/admin/login` so the page can show a
  banner explaining what happened. Clears on the next successful
  login.

### 4. Login banner

`pages/admin/LoginPage.tsx` reads `sessionExpired` from the auth
context and renders a `.login-notice` banner: *"Your session
expired. Please log in again to continue."* No banner on first-time
login.

### 5. Migrated all 8 admin API modules to `apiFetch`

Mechanical replacement of `fetch(` → `apiFetch(` plus the import:

- `features/admin/blocks/api/blocksApi.ts`
- `features/admin/mediaEditor/api/mediaItemsAdminApi.ts`
- `features/admin/enrollments/api/enrollmentsAdminApi.ts`
- `features/admin/catalogEditor/api/index.ts`
- `features/admin/streams/api/streamsApi.ts`
- `features/admin/eventPageEditor/api/eventPagesAdminApi.ts`
- `features/admin/textVisualEditor/api/textVisualsAdminApi.ts`
- `features/admin/homeEditor/api/homeDocAdminApi.ts`

Public-side modules and the upload/hopper module are not migrated
in this pass; they don't run inside the admin auth context. (Public
read endpoints are unauthenticated; the upload module uses the
legacy admin token path.)

## Tests

- `features/auth/__tests__/apiFetch.test.ts` — 6 unit tests covering
  the bus contract: 2xx no-op, 401 notifies, 403 notifies,
  4xx/5xx other than 401/403 don't notify, unsubscribe works,
  response body is preserved so callers can still produce their own
  error messages.

Verification: `tsc --noEmit` clean; `vitest run` — 554 / 554 pass
(one unrelated pre-existing stray test file).

## Generalizable rule

**Auth state must be a reactive signal, not a one-time check.** Any
long-lived single-page app that relies on cookie-based sessions
needs at least three things to keep the frontend's auth view honest:

1. An interceptor on every privileged API call that flips state on
   401/403.
2. A heartbeat on a cadence shorter than the backend's activity
   timeout, so idle-foreground tabs catch expiry proactively.
3. A `visibilitychange` listener so backgrounded tabs re-validate
   on return.

A single one of these three covers some cases; all three together
cover the realistic failure surface.

## Recommendations / follow-ups

- **Public-side calls remain unmigrated** by design. If we ever add
  authenticated public flows (e.g. user accounts), they should use a
  separate bus and not affect the admin's auth state.
- **Per-tab session warning before expiry** is a future polish:
  e.g. "your session expires in 2 minutes, click to extend". Out of
  scope for this fix.
- **Lint rule** banning bare `fetch(` in `features/admin/**/api/**`
  files would prevent the next admin API module from regressing.

## Related

- `architecture--system--authentication.md` — describes the backend
  session model this fix integrates with
- `spec--system--authentication-behavior.md` — extended in this pass
  with a "session-expiry detection (frontend)" section
- `bug--deployment--crypto-randomuuid-insecure-context.md`,
  `bug--deployment--clean-vault-boot-blocked.md` — sibling
  deployment-only bugs whose surface area shrinks once a global
  error reporter is wired alongside this auth interceptor
