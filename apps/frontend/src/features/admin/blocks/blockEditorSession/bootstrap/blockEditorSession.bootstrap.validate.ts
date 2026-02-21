// src/features/admin/blocks/blockEditorSession/bootstrap/blockEditorSession.bootstrap.validate.ts

import { Block, GalleryBlock, GalleryLayout, ItemPosition, LAYOUT_SCHEME } from '@/entities/block';
import { JourneyTicket, JumpResult, ReturnCommand, SerializableBlockHitEvent } from '@/shared/nav';
import { DraftSnapshot } from '@/shared/state';
import { BlockReturnKind, OkJumpResult } from './blockEditorSession.bootstrap.types';

/**
 * Helper: extract union of allowed positions for a given layout from LAYOUT_SCHEME.
 *
 * NOTE:
 * If LAYOUT_SCHEME is typed as `Record<GalleryLayout, ItemPosition[]>` (not `as const`),
 * TS cannot infer literal tuples, but this type still works (it becomes ItemPosition).
 */
export type PositionForLayout<L extends GalleryLayout> =
    (typeof LAYOUT_SCHEME)[L] extends readonly (infer P)[]
        ? Extract<P, ItemPosition>
        : ItemPosition;

type BlockInsertArtEffect = {
    kind: 'blockInsertArt';
    blockId: string;
    pendingSelection: SerializableBlockHitEvent;
};

export type BlockReturnBootstrapInsertValidated<L extends GalleryLayout> = {
    ticket: JourneyTicket & { loot: JumpResult };
    command: BlockInsertArtEffect & {
        pendingSelection: SerializableBlockHitEvent & {
            hit: { blockKind: 'gallery'; kind: 'image'; slot: PositionForLayout<L> };
        };
    };
    loot: OkJumpResult;
    blockId: string;
    layout: L;
    position: PositionForLayout<L>;
    savedData: DraftSnapshot<GalleryBlock & { layout: L }>;
};

function assertPendingSelectionSlotMatchesLayout<L extends GalleryLayout>(
    layout: L,
    pending: SerializableBlockHitEvent & { hit: { blockKind: 'gallery'; kind: 'image'; slot: ItemPosition } },
): asserts pending is SerializableBlockHitEvent & {
    hit: { blockKind: 'gallery'; kind: 'image'; slot: PositionForLayout<L> };
} {
    assertPositionMatchesLayout(layout, pending.hit.slot);
}

export function isBlockReturnKind(kind: ReturnCommand['kind']): kind is BlockReturnKind {
    return kind === 'blockInsertArt' || kind === 'blockUpdateArt' || kind === 'blockSetEventId' || kind === 'blockSetEventBackground';
}

export function isBlockReturnCommand(
    cmd: ReturnCommand | undefined,
): cmd is Extract<ReturnCommand, { kind: BlockReturnKind }> {
    return !!cmd && isBlockReturnKind(cmd.kind);
}

/** Narrow JourneyTicket to RETURN ticket */
function assertReturnTicket(
    ticket: JourneyTicket | undefined,
): asserts ticket is JourneyTicket & { loot: JumpResult } {
    if (!ticket) throw new Error('BlockEditor return bootstrap called without ticket');
    // Check for loot instead of phase - tickets always have phase='outbound'
    // The presence of loot indicates this is a return from a child editor
    if (!ticket.loot) {
        throw new Error(`Expected return ticket with loot, but loot is missing`);
    }
}

export function assertOkLoot(loot: JumpResult | undefined): OkJumpResult {
    if (!loot) throw new Error('Return ticket loot is missing');
    if (!loot.ok) {
        // `reason` field existence depends on your JumpResult definition; keep it defensive.
        const reason = (loot as { reason?: string }).reason ?? 'unknown';
        throw new Error(`Return ticket loot is not ok (reason: ${reason})`);
    }
    if (!loot.id) throw new Error('Return ticket loot.ok=true but id is missing');
    return loot as OkJumpResult;
}

function assertInsertArtEffect(
    effect: JourneyTicket['returnEffect'] | undefined,
): asserts effect is BlockInsertArtEffect {
    if (!effect) throw new Error('Return ticket missing returnEffect');
    if (effect.kind !== 'blockInsertArt') {
        throw new Error(`Expected blockInsertArt, got: ${effect.kind}`);
    }
}

function assertGalleryImagePendingSelection(
    pending: SerializableBlockHitEvent | undefined,
): asserts pending is SerializableBlockHitEvent & {
    hit: { blockKind: 'gallery'; kind: 'image'; slot: ItemPosition };
} {
    if (!pending) throw new Error('ReturnEffect pendingSelection has no data');
    if (pending.hit.blockKind !== 'gallery') {
        throw new Error('Pending selection has wrong block kind');
    }
    if (pending.hit.kind !== 'image') {
        throw new Error('Pending selection has wrong target kind');
    }
    if (pending.hit.slot === undefined || pending.hit.slot === null) {
        throw new Error('Pending selection missing slot');
    }
}

/**
 * Runtime check + TS narrowing:
 * ensures `position` is one of the allowed positions for the given layout.
 *
 * Implemented via Set to avoid TS "never" issues with Array.includes().
 */
export function assertPositionMatchesLayout<L extends GalleryLayout>(
    layout: L,
    position: ItemPosition,
): asserts position is PositionForLayout<L> {
    const allowed = LAYOUT_SCHEME[layout] as readonly ItemPosition[];
    const allowedSet = new Set<ItemPosition>(allowed);
    if (!allowedSet.has(position)) {
        throw new Error(`Position ${position} is not allowed for layout ${layout}`);
    }
}

export function assertGalleryBootstrap<L extends GalleryLayout>(
    bootstrapData: DraftSnapshot<Block> | undefined,
    blockId: string,
    expectedLayout?: L,
): asserts bootstrapData is DraftSnapshot<GalleryBlock & { layout: L }> {
    if (!bootstrapData) throw new Error('No bootstrapData on return');

    if (bootstrapData.draft.id !== blockId) {
        throw new Error(`blockId mismatch: effect(${blockId}) vs draft(${bootstrapData.draft.id})`);
    }

    if (bootstrapData.draft.blockKind !== 'gallery') {
        throw new Error(`Expected gallery block, got: ${bootstrapData.draft.blockKind}`);
    }

    const gb = bootstrapData.draft as GalleryBlock;
    if (expectedLayout && gb.layout !== expectedLayout) {
        throw new Error(`Expected layout ${expectedLayout}, got ${gb.layout}`);
    }
}

export function validateBlockReturnBootstrapInsertArt<L extends GalleryLayout>(
    ticket: JourneyTicket | undefined,
    bootstrapData: DraftSnapshot<Block> | undefined,
    opts?: { expectedLayout?: L },
): BlockReturnBootstrapInsertValidated<L> {
    // 0) Assert ticket has loot (indicates return from child editor)
    assertReturnTicket(ticket);

    // 1) Validate effect kind is ours + is insert
    const effect = ticket.returnEffect;
    if (!isBlockReturnCommand(effect)) {
        throw new Error(
            `Unexpected returnEffect for BlockEditor: ${effect ? effect.kind : 'undefined'}`,
        );
    }
    assertInsertArtEffect(effect);

    // 2) Validate loot
    const loot = assertOkLoot(ticket.loot);

    // 3) Validate effect payload
    const { blockId, pendingSelection } = effect;
    if (!blockId) throw new Error('ReturnEffect missing blockId');
    assertGalleryImagePendingSelection(pendingSelection);

    // 4) Validate bootstrap data matches block and is gallery (+ optional layout constraint)
    assertGalleryBootstrap(bootstrapData, blockId, opts?.expectedLayout);

    const layout = bootstrapData.draft.layout as L;

    // ✅ this will narrow pendingSelection.hit.slot to PositionForLayout<L>
    assertPendingSelectionSlotMatchesLayout(layout, pendingSelection);

    // ✅ build command explicitly, no spreads -> no intersections
    const command: BlockReturnBootstrapInsertValidated<L>['command'] = {
        kind: 'blockInsertArt',
        blockId,
        pendingSelection,
    };

    return {
        ticket,
        command,
        loot,
        blockId,
        layout,
        position: pendingSelection.hit.slot, // now PositionForLayout<L>
        savedData: bootstrapData,
    };
}
