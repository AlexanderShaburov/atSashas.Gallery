// features/auth/authApi.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export type UserInfo = {
    username: string;
    full_name: string;
    is_active: boolean;
};

export type LoginResponse = {
    user: UserInfo;
    message: string;
};

export type LoginCredentials = {
    username: string;
    password: string;
};

/**
 * Login with username and password.
 * Sets HTTP-only session cookie on success.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
    }

    return response.json();
}

/**
 * Logout current user.
 * Clears session cookie.
 */
export async function logout(): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Logout failed');
    }
}

/**
 * Get current authenticated user info.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}
