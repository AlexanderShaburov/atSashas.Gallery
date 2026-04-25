import type { BlockHit, BlockHitEvent, GalleryArtItem, GalleryBlock } from '@/entities/block';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { JourneyTicket } from '@/shared/nav';

// Journey routing for a slot-image click on a gallery block.
//
// Behavior by lifecycle:
//   template → invalid; templates exist as catalogue stamps and can't be
//              the source of a journey. Log and return undefined; the
//              caller will treat that as "no nav".
//   draft / saved → identical:
//      slot has art at that position → open catalog in EDIT mode on that
//                                      art item (returnEffect: blockUpdateArt)
//      slot is empty                 → open catalog in SELECT mode so the
//                                      author can pick or create an art
//                                      item (returnEffect: blockInsertArt)
//
// Why draft and saved share the same routing:
//   - Saved blocks were previously unhandled (switch had no `case 'saved':`),
//     so clicking an assigned slot on an existing block did nothing — see
//     bug--journey--reclick-assigned-slot-no-action.md.
//   - The draft and saved cases differ only in *where* the block is
//     persisted (in-memory draft vs. saved record); the click semantics
//     are the same.
//
// Diagnostics: every decision point logs a structured line so a deployed
// repro of "click did nothing" or "wrong mode" leaves a complete trace.
// The journey-bootstrap-throw bug taught us that silent failures here
// cascade into compound damage; explicit logs make those failures
// debuggable rather than mysterious.

export function printoutTicket(hit: BlockHitEvent): JourneyTicket | undefined {
    if (hit.block.blockKind !== 'gallery' || hit.hit.blockKind !== 'gallery') {
        console.warn('[printoutTicket]: non-gallery hit ignored', {
            blockKind: hit.block.blockKind,
            hitKind: hit.hit.blockKind,
        });
        return;
    }
    if (hit.hit.kind !== 'image') {
        // Other hit kinds (caption, blockCaption) are handled elsewhere
        // (inline-edit, block-caption editor). Not a journey case.
        return;
    }

    const block = hit.block as GalleryBlock;

    switch (block.lifecycle) {
        case 'template': {
            console.error(
                "[printoutTicket]: refused — can't start a journey from a template block",
                { blockId: block.id },
            );
            return;
        }
        case 'draft':
        case 'saved': {
            return buildSlotJourneyTicket(block, hit.hit);
        }
        default: {
            console.error('[printoutTicket]: unsupported lifecycle — no journey dispatched', {
                lifecycle: (block as GalleryBlock).lifecycle,
                blockId: block.id,
            });
            return;
        }
    }
}

function buildSlotJourneyTicket(
    block: GalleryBlock,
    hit: Extract<BlockHit, { blockKind: 'gallery'; kind: 'image' }>,
): JourneyTicket | undefined {
    // Inline the items lookup so the routing decision is local and the
    // diagnostic log shows exactly what was checked. -1 means empty slot,
    // 0+ means an art item lives at that position.
    const idx = block.items.findIndex((it) => it.position === hit.slot);

    if (idx === -1) {
        console.log('[printoutTicket]: empty slot → SELECT journey to catalog', {
            lifecycle: block.lifecycle,
            blockId: block.id,
            slot: hit.slot,
        });
        return makeTicket(block, hit, {
            destinationMode: 'select',
            returnEffectKind: 'blockInsertArt',
        });
    }

    const item = block.items[idx] as GalleryArtItem | undefined;
    if (!item || item.kind !== 'art' || !item.artId) {
        console.error(
            "[printoutTicket]: slot occupied but artId missing — can't open catalog edit",
            { lifecycle: block.lifecycle, blockId: block.id, slot: hit.slot, item },
        );
        return;
    }

    console.log('[printoutTicket]: occupied slot → EDIT journey to catalog', {
        lifecycle: block.lifecycle,
        blockId: block.id,
        slot: hit.slot,
        artId: item.artId,
    });
    return makeTicket(block, hit, {
        destinationMode: 'edit',
        objectId: item.artId,
        returnEffectKind: 'blockUpdateArt',
    });
}

type MakeTicketOpts =
    | { destinationMode: 'select'; returnEffectKind: 'blockInsertArt' }
    | { destinationMode: 'edit'; objectId: string; returnEffectKind: 'blockUpdateArt' };

function makeTicket(
    block: GalleryBlock,
    hit: Extract<BlockHit, { blockKind: 'gallery'; kind: 'image' }>,
    opts: MakeTicketOpts,
): JourneyTicket {
    const destination =
        opts.destinationMode === 'edit'
            ? { editor: 'catalog' as const, mode: 'edit' as const, objectId: opts.objectId }
            : { editor: 'catalog' as const, mode: 'select' as const };

    return {
        journeyId: generateId('travel'),
        destination,
        returnTo: {
            editor: 'block',
            mode: 'edit',
            objectId: block.id,
        },
        phase: 'outbound',
        nonce: createNonce(),
        createdAt: nowIso(),
        returnEffect: {
            kind: opts.returnEffectKind,
            blockId: block.id,
            // Store only serializable data, not the nativeEvent
            pendingSelection: {
                block,
                hit,
            },
        },
    };
}
