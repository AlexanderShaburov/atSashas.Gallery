// src/features/admin/shared/transporter/transporter.ts

import { EditorKind, journeyStackStore, JourneyTicket, JumpResult } from '@/shared/nav';
import { ReturnAddress, ToAddress } from '@/shared/nav/journeyStack.types';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type DispatchFn = (ticket: JourneyTicket) => void;
type ReturnFn = (editor: EditorKind, luggage: JumpResult) => void;
type ArrivalFn = (destination: EditorKind) => JourneyTicket | undefined;
type PeekFn = () => JourneyTicket | undefined;

const ROUTS: Record<EditorKind, string> = {
    stream: `/admin/streams`,
    block: '/admin/blocks',
    catalog: '/admin/catalog',
    hopper: '/admin/hopper',
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
        (ticket: JourneyTicket) => {
            // Save new ticket to stack:
            journeyStackStore.push(ticket);
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
            // Get ticket from the stack:
            const top = journeyStackStore.pickOrThrow();
            // Check ticket if meet to stack:
            if (editor !== top.destination.editor || top.phase !== 'return') return;
            // Check in luggage:
            journeyStackStore.checkInLuggage(top.journeyId, luggage);
            // jump:
            navigate(ROUTS[top.returnTo.editor]);
        },
        [navigate],
    );
}

export function useArrival(): ArrivalFn {
    return useCallback((destination: EditorKind) => {
        console.log(`[useArrival]: Called with destination ${destination}`);
        const top = journeyStackStore.peek();
        if (!top) return undefined;

        const expected = currentLeg(top).editor;
        console.log(`[useArrival]: expected arrival is: ${expected}`);
        if (expected !== destination)
            throw new Error(
                `Arrival on unexpected destination ${destination} instead of ${expected}`,
            );

        return journeyStackStore.consumeLeg();
    }, []);
}

export function usePeekTicket(): PeekFn {
    return useCallback(() => {
        return journeyStackStore.peek();
    }, []);
}
