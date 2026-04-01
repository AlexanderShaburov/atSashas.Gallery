// src/features/admin/shared/transporter/transporter.ts

import { EditorKind, JourneyTicket, JumpResult } from '@/shared/nav';
import { ReturnAddress, ToAddress } from '@/shared/nav/journey.types';
import { journeySessionStore } from '@/shared/nav/journeySession.store';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import { useCallback, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';

type DispatchFn = (ticket: JourneyTicket, home?: JourneyHome) => void;
type ReturnFn = (editor: EditorKind, luggage: JumpResult) => void;
type ArrivalFn = (destination: EditorKind) => JourneyTicket | undefined;
type PeekFn = () => JourneyTicket | undefined;

const ROUTS: Record<EditorKind, string> = {
    stream: `/admin/streams`,
    block: '/admin/blocks',
    catalog: '/admin/catalog',
    hopper: '/admin/hopper',
    events: '/admin/events',
    home: '/admin/public-stream',
    textVisuals: '/admin/text-visuals',
};

function currentLeg(ticket: JourneyTicket): ToAddress | ReturnAddress {
    switch (ticket.phase) {
        case 'outbound':
            return ticket.destination;
        case 'return':
            return ticket.returnTo;
    }
}

export function useDispatch(): DispatchFn {
    const navigate = useNavigate();
    //
    const transport = useCallback(
        (ticket: JourneyTicket, home?: JourneyHome) => {
            // NEW: Use session store (with backward compat for old stack)
            journeySessionStore.pushOutbound(ticket, home);

            // COMPAT: Keep old stack in sync for now
            // journeyStackStore.push(ticket);

            // Define dest address and jump:
            const dest = currentLeg(ticket);
            navigate(ROUTS[dest.editor]);
        },
        [navigate],
    );
    return transport;
}

export function useReturnHome(): ReturnFn {
    const navigate = useNavigate();

    return useCallback(
        (editor: EditorKind, luggage: JumpResult) => {
            console.log(`[useReturnHome]: Called by ${editor} with luggage:`, luggage);

            // NEW: Use session store
            console.log('session before', journeySessionStore._snapshot?.());
            journeySessionStore.completeReturn(editor, luggage);
            console.log('session after', journeySessionStore._snapshot?.());

            const nextAction = journeySessionStore.continueJourney();
            console.log(`[useReturnHome]: Next action determined:`, nextAction);

            switch (nextAction.kind) {
                case 'navigate':
                    navigate(ROUTS[nextAction.editor]);
                    break;
                case 'finishAtHome':
                    // Navigate to home editor
                    navigate(ROUTS[nextAction.home.editor]);
                    // Clear session (journey complete)
                    journeySessionStore.clear();
                    // journeyStackStore.clear();
                    break;
                case 'idle':
                    // No action needed
                    break;
            }
        },
        [navigate],
    );
}

export function useArrival(): ArrivalFn {
    return useCallback((destination: EditorKind) => {
        console.log(`[useArrival]: Called with destination ${destination}`);

        // NEW: Use session store
        const ticket = journeySessionStore.arrival(destination);

        // COMPAT: Keep old stack in sync
        // const top = journeyStackStore.peek();
        // if (top) {
        //     const expected = currentLeg(top).editor;
        //     console.log(`[useArrival]: expected arrival is: ${expected} (compat check)`);
        //     if (expected !== destination) {
        //         throw new Error(
        //             `Arrival on unexpected destination ${destination} instead of ${expected}`,
        //         );
        //     }
        //     journeyStackStore.consumeLeg();
        // }

        return ticket;
    }, []);
}

export function usePeekTicket(editor: EditorKind): PeekFn {
    return useCallback(() => {
        // COMPAT: Use old stack for now (session store needs editor context)
        return journeySessionStore.peekNextTicketFor(editor);
    }, [editor]);
}

/**
 * NEW HOOK: Check if current editor is in a journey.
 * Replaces local isJourney flags with derived state from session store.
 */
export function useJourneyStatus(editor: EditorKind): boolean {
    const hasSession = useSyncExternalStore(
        journeySessionStore.subscribe.bind(journeySessionStore),
        () => journeySessionStore.hasActiveSession(),
        () => false,
    );

    const isInJourney = useSyncExternalStore(
        journeySessionStore.subscribe.bind(journeySessionStore),
        () => journeySessionStore.isEditorInJourney(editor),
        () => false,
    );

    return hasSession && isInJourney;
}
