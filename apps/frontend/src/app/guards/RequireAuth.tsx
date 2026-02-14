// app/guards/RequireAuth.tsx

import { useAuth } from '@/features/auth/authContext';
import { Navigate, useLocation } from 'react-router-dom';

type Props = {
    children: React.ReactNode;
};

/**
 * Route guard that requires authentication.
 * Redirects to /admin/login if not authenticated.
 */
export function RequireAuth({ children }: Props) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    fontSize: '1.25rem',
                    color: '#718096',
                }}
            >
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, but save the attempted location
        return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}
