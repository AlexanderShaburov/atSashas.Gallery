import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { JourneyTicket } from '@/shared/nav';
import { generateId } from './editorLogic';

export function printoutTicket(): JourneyTicket {
    const id = generateId('art');
    const ticket: JourneyTicket = {
        journeyId: generateId('travel'),
        destination: {
            editor: 'hopper',
            mode: 'select',
        },
        returnTo: {
            editor: 'catalog',
            mode: 'edit',
            objectId: id,
        },
        phase: 'outbound',
        nonce: createNonce(),
        createdAt: nowIso(),
        returnEffect: {
            kind: 'createArtItem',
            itemId: id,
        },
    };
    return ticket;
}
