// src/features/admin/blocks/blockEditorSession/bootstrap/blockEditorSession.bootstrap.validate.ts
import { LAYOUT_SCHEME } from '@/entities/block';
function assertPendingSelectionSlotMatchesLayout(layout, pending) {
    assertPositionMatchesLayout(layout, pending.hit.slot);
}
export function isBlockReturnKind(kind) {
    return kind === 'blockInsertArt' || kind === 'blockUpdateArt';
}
export function isBlockReturnCommand(cmd) {
    return !!cmd && isBlockReturnKind(cmd.kind);
}
/** Narrow JourneyTicket to RETURN ticket */
function assertReturnTicket(ticket) {
    if (!ticket)
        throw new Error('BlockEditor return bootstrap called without ticket');
    if (ticket.phase !== 'return') {
        throw new Error(`Expected return ticket, got: ${ticket.phase}`);
    }
}
export function assertOkLoot(loot) {
    if (!loot)
        throw new Error('Return ticket loot is missing');
    if (!loot.ok) {
        // `reason` field existence depends on your JumpResult definition; keep it defensive.
        const reason = loot.reason ?? 'unknown';
        throw new Error(`Return ticket loot is not ok (reason: ${reason})`);
    }
    if (!loot.id)
        throw new Error('Return ticket loot.ok=true but id is missing');
    return loot;
}
function assertInsertArtEffect(effect) {
    if (!effect)
        throw new Error('Return ticket missing returnEffect');
    if (effect.kind !== 'blockInsertArt') {
        throw new Error(`Expected blockInsertArt, got: ${effect.kind}`);
    }
}
function assertGalleryImagePendingSelection(pending) {
    if (!pending)
        throw new Error('ReturnEffect pendingSelection has no data');
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
export function assertPositionMatchesLayout(layout, position) {
    const allowed = LAYOUT_SCHEME[layout];
    const allowedSet = new Set(allowed);
    if (!allowedSet.has(position)) {
        throw new Error(`Position ${position} is not allowed for layout ${layout}`);
    }
}
export function assertGalleryBootstrap(bootstrapData, blockId, expectedLayout) {
    if (!bootstrapData)
        throw new Error('No bootstrapData on return');
    if (bootstrapData.draft.id !== blockId) {
        throw new Error(`blockId mismatch: effect(${blockId}) vs draft(${bootstrapData.draft.id})`);
    }
    if (bootstrapData.draft.blockKind !== 'gallery') {
        throw new Error(`Expected gallery block, got: ${bootstrapData.draft.blockKind}`);
    }
    const gb = bootstrapData.draft;
    if (expectedLayout && gb.layout !== expectedLayout) {
        throw new Error(`Expected layout ${expectedLayout}, got ${gb.layout}`);
    }
}
export function validateBlockReturnBootstrapInsertArt(ticket, bootstrapData, opts) {
    // 0) Narrow ticket.phase to 'return'
    assertReturnTicket(ticket);
    // 1) Validate effect kind is ours + is insert
    const effect = ticket.returnEffect;
    if (!isBlockReturnCommand(effect)) {
        throw new Error(`Unexpected returnEffect for BlockEditor: ${effect ? effect.kind : 'undefined'}`);
    }
    assertInsertArtEffect(effect);
    // 2) Validate loot
    const loot = assertOkLoot(ticket.loot);
    // 3) Validate effect payload
    const { blockId, pendingSelection } = effect;
    if (!blockId)
        throw new Error('ReturnEffect missing blockId');
    assertGalleryImagePendingSelection(pendingSelection);
    // 4) Validate bootstrap data matches block and is gallery (+ optional layout constraint)
    assertGalleryBootstrap(bootstrapData, blockId, opts?.expectedLayout);
    const layout = bootstrapData.draft.layout;
    // ✅ this will narrow pendingSelection.hit.slot to PositionForLayout<L>
    assertPendingSelectionSlotMatchesLayout(layout, pendingSelection);
    // ✅ build command explicitly, no spreads -> no intersections
    const command = {
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
