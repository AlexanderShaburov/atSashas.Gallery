// src/features/admin/shared/hooks/useJourneyGuard.ts

import { EditorKind } from '@/shared/nav';
import { journeySessionStore } from '@/shared/nav/journeySession.store';
import { useJourneyStatus } from '@/features/admin/shared/transporter/transporter';
import { useCallback } from 'react';

export type JourneyGuardResult =
    | { allowed: true }
    | { allowed: false; reason: string };

/**
 * Hook to guard actions that shouldn't happen during a journey
 * Use this to prevent deletion while user is in the middle of editing
 */
export function useJourneyGuard(editorKind: EditorKind) {
    const isInJourney = useJourneyStatus(editorKind);

    const canStartDeletion = useCallback((): JourneyGuardResult => {
        if (journeySessionStore.hasActiveSession()) {
            return {
                allowed: false,
                reason: 'Cannot start deletion while in journey mode. Please save or cancel your current work first.',
            };
        }
        return { allowed: true };
    }, []);

    const guardAction = useCallback(
        (action: () => void, blockedMessage?: string): void => {
            const result = canStartDeletion();
            if (!result.allowed) {
                alert(blockedMessage || result.reason);
                return;
            }
            action();
        },
        [canStartDeletion],
    );

    return {
        isInJourney,
        canStartDeletion,
        guardAction,
    };
}
