// features/auth/authContext.tsx

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as authApi from './authApi';
import { onSessionExpired } from './sessionBus';

type AuthState = {
    user: authApi.UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    /**
     * True when a previously authenticated session was invalidated mid-flight
     * (heartbeat reported 401, the user's tab returned and /auth/me failed,
     * or an admin API call surfaced 401/403 via the session bus). The Login
     * page reads this to show a clear "session expired" banner instead of
     * the user thinking they were logged out for no reason.
     *
     * Reset to `false` on the next successful login.
     */
    sessionExpired: boolean;
};

type AuthContextValue = AuthState & {
    login: (credentials: authApi.LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
    children: React.ReactNode;
};

// Heartbeat cadence. Short enough to catch a stale session within a couple
// of minutes (so the user doesn't keep editing into the void); long enough
// that it doesn't hammer /auth/me and doesn't itself defeat the backend's
// 30-minute activity timeout. The visibility listener catches the longer
// "tab was backgrounded for an hour" case immediately on return.
const HEARTBEAT_INTERVAL_MS = 60_000;

export function AuthProvider({ children }: Props) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        sessionExpired: false,
    });

    // We need the *current* isAuthenticated inside long-lived effects
    // (heartbeat / visibility / sessionBus) without re-binding them on
    // every render. A ref tracks the latest value.
    const isAuthenticatedRef = useRef(false);
    isAuthenticatedRef.current = state.isAuthenticated;

    const checkAuth = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true }));
        const user = await authApi.getCurrentUser();
        setState((prev) => ({
            user,
            isLoading: false,
            isAuthenticated: !!user,
            // If we already had a session-expired flag, keep it visible
            // (the user landed on /admin/login and we want them to see
            // the banner). It clears on the next successful login.
            sessionExpired: prev.sessionExpired,
        }));
    }, []);

    // Initial mount check.
    useEffect(() => {
        void checkAuth();
    }, [checkAuth]);

    // Mark the session expired without thrashing state when nothing changed.
    const markSessionExpired = useCallback(() => {
        setState((prev) => {
            if (!prev.isAuthenticated && prev.user === null && prev.sessionExpired) {
                return prev;
            }
            return {
                user: null,
                isLoading: false,
                isAuthenticated: false,
                sessionExpired: true,
            };
        });
    }, []);

    // Subscribe to session-expired notifications from apiFetch (any admin
    // call that received 401/403). This catches stale sessions immediately
    // on the next backend-touching action, well before the heartbeat would.
    useEffect(() => {
        return onSessionExpired(() => {
            // Only react if we currently believe we are authenticated —
            // avoids redundant state writes when already on /admin/login.
            if (isAuthenticatedRef.current) markSessionExpired();
        });
    }, [markSessionExpired]);

    // Background heartbeat: re-checks /auth/me every minute while we
    // believe we're authenticated. Catches the "user has been idle in
    // a foreground tab past the activity timeout" case proactively, so
    // the next click doesn't run into a silent 401.
    useEffect(() => {
        if (!state.isAuthenticated) return;
        const id = window.setInterval(() => {
            void (async () => {
                const user = await authApi.getCurrentUser();
                if (!user) markSessionExpired();
            })();
        }, HEARTBEAT_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [state.isAuthenticated, markSessionExpired]);

    // Visibility listener: when the user returns to a tab that was
    // backgrounded long enough for the cookie / activity-timeout to
    // lapse, re-check immediately rather than wait for the heartbeat
    // tick.
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState !== 'visible') return;
            if (!isAuthenticatedRef.current) return;
            void (async () => {
                const user = await authApi.getCurrentUser();
                if (!user) markSessionExpired();
            })();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [markSessionExpired]);

    async function handleLogin(credentials: authApi.LoginCredentials) {
        const response = await authApi.login(credentials);
        setState({
            user: response.user,
            isLoading: false,
            isAuthenticated: true,
            sessionExpired: false,
        });
    }

    async function handleLogout() {
        await authApi.logout();
        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            sessionExpired: false,
        });
    }

    const value: AuthContextValue = {
        ...state,
        login: handleLogin,
        logout: handleLogout,
        refetchUser: checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
