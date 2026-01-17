// src/features/admin/streams/streamEditorSession/streamEditorSession.guards.ts

import { StreamData } from '@/entities/stream';
import { JourneyTicket, JumpResult, ReturnCommand } from '@/shared/nav';
import { DraftSnapshot } from '@/shared/state/editorSessionsData.store';

type ReturnKind = ReturnCommand['kind'];
type returnByKind<K extends ReturnKind> = Extract<ReturnCommand, { kind: K }>;

type OkJumpResult = JumpResult & { ok: true };

export function contextDataConsistencyCheck(
    ticket: JourneyTicket,
    data: DraftSnapshot<StreamData> | undefined,
): asserts data is DraftSnapshot<StreamData> {
    if (!data || !data.draft || !data.snapshot) {
        throw new Error(`Data store doesn't cary data for stream while ticket do`);
    }
    if (ticket.phase !== 'return') {
        throw new Error(`Stream editor can't be called as a child`);
    }

    if (ticket.returnTo.mode !== 'edit') {
        throw new Error(`Stream editor can't return into select mode`);
    }
    if (ticket.returnTo.objectId !== data.snapshot.streamId) {
        throw new Error(`Ticket and editorSessionDataStor stream id's doesn't match`);
    }
    if (!ticket.returnEffect) {
        throw new Error(`Ticket came without returnEffect`);
    }
    // Dummy check -> Before starting process ticket we have to ensure:
    //     2. stream sessionDataStore record is available and consistent
    if (!data || !data.draft.streamId) {
        throw new Error(
            `SessionDataStore doesn't have data for stream while it starts with the ticket`,
        );
    }
    const kind = ticket.returnEffect.kind;
    if (
        kind !== 'streamInsertBlock' &&
        kind !== 'streamReplaceBlock' &&
        kind !== 'streamUpdateBlock'
    ) {
        throw new Error(
            `Ticket came having wrong return instructions kind: ${ticket.returnEffect.kind}`,
        );
    }
    //     3. ticket and store data match
    if (data.draft.streamId !== ticket.returnEffect.streamId) {
        throw new Error(`SessionDataStore and ticket rely on different streamId`);
    }
    if (ticket.returnEffect.streamId !== ticket.returnTo.objectId) {
        throw new Error(`Ticket came having mismatch in stream ids within`);
    }
    return;
}

function assertOkLuggage(luggage: JumpResult | undefined): asserts luggage is OkJumpResult {
    if (!luggage?.ok) throw new Error(`Inconsistent luggage`);
}
export function assertReturnCommand<K extends ReturnKind>(
    kind: K,
    command: ReturnCommand,
    luggage: JumpResult | undefined,
): asserts command is returnByKind<K> {
    if (command.kind !== kind) {
        throw new Error(`Unexpected command kind: got ${command.kind}, expected ${kind}`);
    }

    assertOkLuggage(luggage);
}
