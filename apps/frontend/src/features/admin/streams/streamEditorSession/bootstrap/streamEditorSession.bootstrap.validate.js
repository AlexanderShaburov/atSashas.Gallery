import { STREAM_RETURN_KINDS, } from './streamEditorSession.bootstrap.types';
function isStreamReturnKind(kind) {
    return STREAM_RETURN_KINDS.includes(kind);
}
export function validateStreamReturnBootstrap(ticket, storeData) {
    if (!ticket) {
        throw new Error('StreamEditor bootstrap called without ticket');
    }
    if (ticket.phase !== 'return') {
        throw new Error('StreamEditor expects return-phase ticket');
    }
    if (ticket.returnTo.mode !== 'edit') {
        throw new Error('StreamEditor cannot return into select mode');
    }
    const effect = ticket.returnEffect;
    if (!effect) {
        throw new Error('Return ticket missing returnEffect');
    }
    if (!isStreamReturnKind(effect.kind)) {
        throw new Error(`Unexpected returnEffect kind: ${effect.kind}`);
    }
    if (!storeData?.draft || !storeData.snapshot) {
        throw new Error('StoreData missing draft/snapshot on stream return');
    }
    const streamIdFromStore = storeData.snapshot.streamId ?? storeData.draft.streamId;
    const streamIdFromTicket = ticket.returnTo.objectId;
    if (!streamIdFromStore) {
        throw new Error('StoreData missing streamId');
    }
    if (streamIdFromStore !== streamIdFromTicket) {
        throw new Error(`Ticket streamId (${streamIdFromTicket}) != store streamId (${streamIdFromStore})`);
    }
    const loot = ticket.loot;
    if (!loot?.ok) {
        throw new Error('Return ticket loot is missing or inconsistent');
    }
    const okLoot = loot;
    return {
        ticket: ticket,
        storeData,
        streamId: streamIdFromStore,
        selectedStreamId: streamIdFromStore,
        command: effect,
        loot: okLoot,
    };
}
