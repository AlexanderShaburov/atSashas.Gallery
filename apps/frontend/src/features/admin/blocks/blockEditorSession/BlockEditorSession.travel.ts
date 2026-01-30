import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { JourneyTicket } from '@/shared/nav';
import { BlockHitEvent } from '../ui/BlockTemplates';
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
                            pendingSelection: hit,
                        },
                    };
                    return ticket;
                } else {
                    const ticket: JourneyTicket = {
                        journeyId: generateId('travel'),
                        destination: {
                            editor: 'catalog',
                            mode: 'edit',
                            objectId: hit.block.items[idx]?.artId ?? '__none__',
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
                            pendingSelection: hit,
                        },
                    };
                    return ticket;
                }
            }
        }
    }
}
