// streamEditorSession.bootstrap.validate.ts
import type { StreamData } from '@/entities/stream';
import type { JourneyTicket } from '@/shared/nav';
import { type OkJumpResult } from '@/shared/nav';
import type { DraftSnapshot } from '@/shared/state/editorSessionsData.store';
import {
    STREAM_RETURN_KINDS,
    type StreamReturnBootstrapValidated,
    type StreamReturnCommand,
} from './streamEditorSession.bootstrap.types';

function isStreamReturnKind(kind: string): kind is (typeof STREAM_RETURN_KINDS)[number] {
    return (STREAM_RETURN_KINDS as readonly string[]).includes(kind);
}

export function validateStreamReturnBootstrap(
    ticket: JourneyTicket | undefined,
    storeData: DraftSnapshot<StreamData> | undefined,
): StreamReturnBootstrapValidated {
    if (!ticket) {
        throw new Error('StreamEditor bootstrap called without ticket');
    }

    // Check if this is a return by presence of loot (attached by returnHome())
    // Note: tickets always have phase='outbound', the leg state determines if it's returning
    if (!ticket.loot) {
        throw new Error('StreamEditor expects ticket with loot (from child editor return)');
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
        throw new Error(
            `Ticket streamId (${streamIdFromTicket}) != store streamId (${streamIdFromStore})`,
        );
    }

    const loot = ticket.loot;
    if (!loot?.ok) {
        throw new Error('Return ticket loot is missing or inconsistent');
    }

    const okLoot = loot as OkJumpResult;

    return {
        ticket: ticket as StreamReturnBootstrapValidated['ticket'],
        storeData,
        streamId: streamIdFromStore,
        selectedStreamId: streamIdFromStore,
        command: effect as StreamReturnCommand,
        loot: okLoot,
    };
}
