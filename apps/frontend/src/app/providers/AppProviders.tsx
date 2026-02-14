// src/app/providers/AppProviders.tsx

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AuthProvider } from '@/features/auth/authContext';
import { PropsWithChildren } from 'react';

export function AppProviders({ children }: PropsWithChildren) {
    return (
        <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
    );
}
