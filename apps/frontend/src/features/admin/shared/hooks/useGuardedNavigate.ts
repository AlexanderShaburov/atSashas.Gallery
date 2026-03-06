// src/features/admin/shared/hooks/useGuardedNavigate.ts

import { journeySessionStore } from '@/shared/nav';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Wraps useNavigate() with a Journey guard.
 * If a journey is active, shows a confirmation dialog before navigating.
 * Same UX message as GuardedNavLink.
 */
export function useGuardedNavigate() {
    const navigate = useNavigate();

    const guardedNavigate = useCallback(
        (to: string) => {
            if (journeySessionStore.hasActiveSession()) {
                const ok = confirm(
                    'A journey is currently active. Navigating away will abandon it. Continue?',
                );
                if (!ok) return;
                journeySessionStore.clear();
            }
            navigate(to);
        },
        [navigate],
    );

    return guardedNavigate;
}
