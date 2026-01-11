// src/features/admin/shared/transporter/transporter.ts

import { Address, journeyStackStore, JourneyTicket, JumpResult } from '@/shared/nav';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type DispatchFn = (ticket: JourneyTicket, luggage: JumpResult) => void;
type ReturnFn = ()
function routeFromTarget(to: Address): string {
    switch (to.kind) {
        case 'streamsIndex':
            return `/admin/streams`;
        case 'streamEditor':
            return `/admin/streams`;
        case 'blockEditor':
            return '/admin/blocks';
        case 'catalogEditor':
            return '/admin/catalog';
    }
}

function currentLeg(ticket: JourneyTicket): Address {
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
        (ticket: JourneyTicket, luggage?: JumpResult) => {
            if (luggage && ticket.phase === 'return')
                journeyStackStore.checkInLuggage(ticket.journeyId, luggage);
            const dest = currentLeg(ticket);
            journeyStackStore.push(ticket);
            navigate(routeFromTarget(dest));
        },
        [navigate],
    );
    return transport;
}

export function useReturn