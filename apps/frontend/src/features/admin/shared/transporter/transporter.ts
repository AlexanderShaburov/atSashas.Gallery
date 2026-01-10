import { Address, JourneyLeg, journeyStackStore, JourneyTicket, JumpResult } from '@/shared/nav';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
        case 'created':
            return ticket.destination;
        case 'arrived': {
            throw new Error(`Transportation error: bad ticket with id; ${ticket.journeyId}`)
            break
        }
        case 'returning':
            return ticket.returnTo;
        case 'completed': {
            throw new Error(`Transportation error: bad ticket with id; ${ticket.journeyId}`)
            break
        }
            
    }
}

export function useTransporter() {
    const navigate = useNavigate();

    const transport = useCallback((ticket: JourneyTicket, luggage?: JumpResult) => {
        switch (ticket.phase) {
            case 'created': {
                if (!journeyStackStore.checkTicket(ticket.journeyId)) {
                    
                }
            }

        }
    }, deps)

    return (ticket: JourneyTicket, luggage?: JumpResult) => {
        if 
        journeyStackStore.push(ticket);
        navigate(routeFromTarget(currentLeg(ticket)));
    };
}
