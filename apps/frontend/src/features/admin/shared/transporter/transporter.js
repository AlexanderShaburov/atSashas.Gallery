// src/features/admin/shared/transporter/transporter.ts
import { journeyStackStore } from '@/shared/nav';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
const ROUTS = {
    stream: `/admin/streams`,
    block: '/admin/blocks',
    catalog: '/admin/catalog',
    hopper: '/admin/hopper',
};
function currentLeg(ticket) {
    switch (ticket.phase) {
        case 'outbound':
            return ticket.destination;
        case 'return':
            return ticket.returnTo;
    }
}
export function useDispatch() {
    const navigate = useNavigate();
    //
    const transport = useCallback((ticket) => {
        // Save new ticket to stack:
        journeyStackStore.push(ticket);
        // Define dest address and jump:
        const dest = currentLeg(ticket);
        navigate(ROUTS[dest.editor]);
    }, [navigate]);
    return transport;
}
export function useReturnHome() {
    const navigate = useNavigate();
    return useCallback((editor, luggage) => {
        // Get ticket from the stack:
        const top = journeyStackStore.pickOrThrow();
        // Check ticket if meet to stack:
        if (editor !== top.destination.editor || top.phase !== 'return')
            return;
        // Check in luggage:
        journeyStackStore.checkInLuggage(top.journeyId, luggage);
        // jump:
        navigate(ROUTS[top.returnTo.editor]);
    }, [navigate]);
}
export function useArrival() {
    return useCallback((destination) => {
        console.log(`[useArrival]: Called wit destination ${destination}`);
        const top = journeyStackStore.peek();
        if (!top)
            return undefined;
        const expected = currentLeg(top).editor;
        console.log(`[useArrival]: expected arrival is: ${expected}`);
        if (expected !== destination)
            throw new Error(`Arrival on unexpected destination ${destination} instead of ${expected}`);
        return journeyStackStore.consumeLeg();
    }, []);
}
export function usePeekTicket() {
    return useCallback(() => {
        return journeyStackStore.peek();
    }, []);
}
