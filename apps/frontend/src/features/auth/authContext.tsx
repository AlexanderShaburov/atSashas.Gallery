// features/auth/authContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from './authApi';

type AuthState = {
    user: authApi.UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
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

export function AuthProvider({ children }: Props) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Check authentication status on mount
    useEffect(() => {
        void checkAuth();
    }, []);

    async function checkAuth() {
        setState((prev) => ({ ...prev, isLoading: true }));
        const user = await authApi.getCurrentUser();
        setState({
            user,
            isLoading: false,
            isAuthenticated: !!user,
        });
    }

    async function handleLogin(credentials: authApi.LoginCredentials) {
        const response = await authApi.login(credentials);
        setState({
            user: response.user,
            isLoading: false,
            isAuthenticated: true,
        });
    }

    async function handleLogout() {
        await authApi.logout();
        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
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
