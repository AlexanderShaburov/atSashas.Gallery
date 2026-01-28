import type { ItemPosition } from '@/entities/block';
import type { JourneyTicket, JumpResult, ReturnCommand } from '@/shared/nav/journeyStack.types';

export type BlockReturnKind = 'blockInsertArt' | 'blockUpdateArt';

export type OkJumpResult = Extract<JumpResult, { ok: true }>;

export type BlockReturnBootstrapValidated = {
    ticket: JourneyTicket;
    command: Extract<ReturnCommand, { kind: BlockReturnKind }>;
    blockId: string;
    position: ItemPosition;
    loot: OkJumpResult;
};
