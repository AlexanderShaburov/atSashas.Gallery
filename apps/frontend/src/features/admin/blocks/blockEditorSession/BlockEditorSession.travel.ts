import type { BlockHitEvent, GalleryArtItem, ItemPosition } from '@/entities/block';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { JourneyTicket } from '@/shared/nav';
import { findArtItemByPos } from './blockEditorSession.utils';

export function printoutTicket(hit: BlockHitEvent): JourneyTicket | undefined {
    // Validate context:
    // screenMode - edit
    // blockKind - gallery
    // target kind - image !!!!

    // What stage of lifecycle block goes:
    // if template -> error;
    // if draft -> check:
    //      if image for position is already selected:
    //          - catalog should be opened in edit mode and artItem with
    //            selected id under edit;
    //      if no:
    //          - catalog should be opened id select screen mode;
    // if saved -> catalog should be opened in edit mode and artItem with
    //            selected id under edit
    if (hit.block.blockKind !== 'gallery' || hit.hit.blockKind !== 'gallery') return;
    if (
        hit &&
        hit.hit.blockKind === 'gallery' &&
        hit.hit.kind === 'image' &&
        hit.block.blockKind === 'gallery'
    ) {
        switch (hit.block.lifecycle) {
            case 'template': {
                throw new Error(`Journey can't be started from template`);
                break;
            }
            case 'draft': {
                const idx = findArtItemByPos(hit, hit.hit.slot);
                if (!idx) return;
                if (idx === -1) {
                    // draft has no image selected for slot with pos:
                    const ticket: JourneyTicket = {
                        journeyId: generateId('travel'),
                        destination: {
                            editor: 'catalog',
                            mode: 'select',
                        },
                        returnTo: {
                            editor: 'block',
                            mode: 'edit',
                            objectId: hit.block.id,
                        },
                        phase: 'outbound',
                        nonce: createNonce(),
                        createdAt: nowIso(),
                        returnEffect: {
                            kind: 'blockInsertArt',
                            blockId: hit.block.id,
                            // Store only serializable data, not the nativeEvent
                            pendingSelection: {
                                block: hit.block,
                                hit: hit.hit,
                            },
                        },
                    };
                    return ticket;
                } else {
                    const ticket: JourneyTicket = {
                        journeyId: generateId('travel'),
                        destination: {
                            editor: 'catalog',
                            mode: 'edit',
                            objectId: (hit.block.items[idx] as GalleryArtItem | undefined)?.artId ?? '__none__',
                        },
                        returnTo: {
                            editor: 'block',
                            mode: 'edit',
                            objectId: hit.block.id,
                        },
                        phase: 'outbound',
                        nonce: createNonce(),
                        createdAt: nowIso(),
                        returnEffect: {
                            kind: 'blockUpdateArt',
                            blockId: hit.block.id,
                            // Store only serializable data, not the nativeEvent
                            pendingSelection: {
                                block: hit.block,
                                hit: hit.hit,
                            },
                        },
                    };
                    return ticket;
                }
            }
        }
    }
}

// Legacy helper. No live caller in the UI — kept compilable post-EventPage
// canonicalization so that `galleryEventPickEvent` BlockHit / BlockTarget
// entries still typecheck until they are cleaned up in a follow-up pass.
// Dispatches at `eventPages` now (the canonical entity); real retirement of
// this block-level flow is tracked separately.
export function createEventPickTicket(blockId: string, position: ItemPosition): JourneyTicket {
    return {
        journeyId: generateId('travel'),
        destination: {
            editor: 'eventPages',
            mode: 'select',
        },
        returnTo: {
            editor: 'block',
            mode: 'edit',
            objectId: blockId,
        },
        phase: 'outbound',
        nonce: createNonce(),
        createdAt: nowIso(),
        returnEffect: {
            kind: 'blockSetEventId',
            blockId,
            position,
        },
    };
}

export function createBackgroundPickTicket(blockId: string, position: ItemPosition): JourneyTicket {
    return {
        journeyId: generateId('travel'),
        destination: {
            editor: 'catalog',
            mode: 'select',
        },
        returnTo: {
            editor: 'block',
            mode: 'edit',
            objectId: blockId,
        },
        phase: 'outbound',
        nonce: createNonce(),
        createdAt: nowIso(),
        returnEffect: {
            kind: 'blockSetEventBackground',
            blockId,
            position,
        },
    };
}
