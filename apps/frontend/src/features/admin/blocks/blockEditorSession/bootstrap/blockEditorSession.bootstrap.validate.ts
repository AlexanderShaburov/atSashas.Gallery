import { Block } from '@/entities/block';
import { JourneyTicket, JumpResult, ReturnCommand } from '@/shared/nav';
import { DraftSnapshot } from '@/shared/state';
import {
    BlockReturnBootstrapValidated,
    BlockReturnKind,
    OkJumpResult,
} from './blockEditorSession.bootstrap.types';

export function isBlockReturnKind(kind: ReturnCommand['kind']): kind is BlockReturnKind {
    return kind === 'blockInsertArt' || kind === 'blockUpdateArt';
}

export function isBlockReturnCommand(
    cmd: ReturnCommand | undefined,
): cmd is Extract<ReturnCommand, { kind: BlockReturnKind }> {
    return !!cmd && isBlockReturnKind(cmd.kind);
}

export function assertOkLoot(loot: JumpResult | undefined): OkJumpResult {
    if (!loot) throw new Error('Return ticket loot is missing');
    if (!loot.ok)
        throw new Error(`Return ticket loot is not ok (reason: ${loot.reason ?? 'unknown'})`);
    if (!loot.id) throw new Error('Return ticket loot.ok=true but id is missing');
    return loot;
}

export function validateBlockReturnBootstrap(
    ticket: JourneyTicket | undefined,
    currentBlockIdFromSession: DraftSnapshot<Block> | undefined,
): BlockReturnBootstrapValidated {
    if (!ticket) throw new Error('BlockEditor return bootstrap called without ticket');

    if (ticket.phase !== 'return') {
        throw new Error(`Expected return ticket, got: ${ticket.phase}`);
    }

    // 1) Check if return ticket is ours i.e. effect kind is (blockInsertArt/blockUpdateArt)
    const effect = ticket.returnEffect;
    if (!isBlockReturnCommand(effect)) {
        throw new Error(
            `Unexpected returnEffect for BlockEditor: ${effect ? effect.kind : 'undefined'}`,
        );
    }

    // 2) Check loot
    const okLoot = assertOkLoot(ticket.loot);

    // 3) Get blockId/position from returnEffect (data format is equal for both kinds)
    const { blockId, position } = effect;
    if (!blockId) throw new Error('ReturnEffect missing blockId');
    // position — ItemPosition;
    if (position === undefined || position === null) {
        throw new Error('ReturnEffect missing position');
    }

    // 4) Check saved bootstrap data
    if (!currentBlockIdFromSession) {
        throw new Error('BlockEditor has no current block id in session on return');
    }

    if (currentBlockIdFromSession.draft.id !== blockId) {
        throw new Error(
            `ReturnEffect blockId (${blockId}) does not match current session blockId (${currentBlockIdFromSession})`,
        );
    }

    return {
        ticket,
        command: effect,
        blockId,
        position,
        loot: okLoot,
    };
}
