// features/auth/apiFetch.ts
//
// Thin fetch wrapper for admin-side API calls. Same signature as the
// global `fetch`, with one extra behavior: when the response is a 401
// or 403, it broadcasts via `sessionBus` so AuthProvider can flip
// `isAuthenticated` to false and the route guard can redirect to login.
// This is what closes the "zombie authenticated state" gap reported in
// `bug--auth--silent-session-expiry-zombie-state.md`.
//
// Per-module migration is intentionally minimal: replace `fetch(` with
// `apiFetch(` at the call sites. No other behavior changes — `apiFetch`
// preserves the response, including the failed status, so callers can
// still surface their own errors to the user.

import { notifySessionExpired } from './sessionBus';

export async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const res = await fetch(input, init);
    if (res.status === 401 || res.status === 403) {
        // Don't await anything else — we want this to propagate
        // immediately, before the calling code reads the body.
        notifySessionExpired();
    }
    return res;
}
