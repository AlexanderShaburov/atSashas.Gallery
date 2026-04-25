// features/auth/sessionBus.ts
//
// Minimal pub/sub used to broadcast session-expiry signals from any API
// caller back to AuthProvider. Three producers in the codebase:
//   1. apiFetch — wraps fetch and notifies on 401/403 responses.
//   2. AuthProvider's heartbeat — periodic /auth/me check.
//   3. AuthProvider's visibility listener — re-check on tab return.
//
// Single consumer: AuthProvider, which flips `isAuthenticated` to false
// and surfaces a "session expired" notice. RequireAuth then redirects
// to /admin/login on next render.

type Listener = () => void;

const listeners = new Set<Listener>();

/** Notify all subscribers that the user's session is no longer valid. */
export function notifySessionExpired(): void {
    // Copy before iterating in case a listener unsubscribes during dispatch.
    for (const fn of [...listeners]) {
        try {
            fn();
        } catch (err) {
            // Never let a misbehaving subscriber break the dispatch.
            console.error('[sessionBus] listener threw', err);
        }
    }
}

/** Subscribe to session-expired events. Returns an unsubscribe fn. */
export function onSessionExpired(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}
