import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from './editorLogic';
export function printoutTicket() {
    const id = generateId('art');
    const ticket = {
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
