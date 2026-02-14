// pages/admin/LoginPage.tsx

import { useAuth } from '@/features/auth/authContext';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
    const { isAuthenticated, isLoading, login } = useAuth();
    const location = useLocation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect to admin if already authenticated
    if (isAuthenticated) {
        const from = (location.state as { from?: string })?.from || '/admin';
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login({ username, password });
            // Redirect happens via Navigate above after state updates
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-loading">Checking authentication...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Admin Login</h1>
                <p className="login-subtitle">atSashas.Gallery</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="username" className="login-label">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password" className="login-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isSubmitting || !username || !password}
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
