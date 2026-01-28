// streamEditorSession.bootstrap.types.ts
import type { StreamData } from '@/entities/stream';
import type { JourneyTicket, OkJumpResult, ReturnCommand } from '@/shared/nav';
import type { DraftSnapshot } from '@/shared/state/editorSessionsData.store';

export const STREAM_RETURN_KINDS = [
    'streamInsertBlock',
    'streamReplaceBlock',
    'streamUpdateBlock',
] as const;

export type StreamReturnKind = (typeof STREAM_RETURN_KINDS)[number];
export type StreamReturnCommand = Extract<ReturnCommand, { kind: StreamReturnKind }>;

export type StreamReturnBootstrapValidated = {
    ticket: JourneyTicket & {
        phase: 'return';
        returnTo: { mode: 'edit'; objectId: string };
        returnEffect: StreamReturnCommand;
        loot: OkJumpResult;
    };

    storeData: DraftSnapshot<StreamData>;

    // derivatives
    streamId: string;
    selectedStreamId: string;
    command: StreamReturnCommand;
    loot: OkJumpResult;
};
