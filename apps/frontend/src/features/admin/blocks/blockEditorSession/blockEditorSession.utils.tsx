import { Block, EditTarget } from '@/entities/block';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { generateId } from '@/shared/lib/id/generateId';

export const hitToTarget = (e: BlockHitEvent): EditTarget => {
    switch (e.hit.blockKind) {
        case 'gallery': {
            switch (e.hit.kind) {
                case 'image':
                case 'imageCaption':
                    return {
                        blockKind: 'gallery',
                        kind: e.hit.kind,
                        slot: e.hit.slot,
                    };

                case 'blockCaption':
                    return {
                        blockKind: 'gallery',
                        kind: 'blockCaption',
                        slot: undefined,
                    };
            }
            break;
        }

        case 'text': {
            switch (e.hit.kind) {
                case 'textTitle':
                    return { blockKind: 'text', kind: 'title' };
                case 'textBody':
                    return { blockKind: 'text', kind: 'body' };
            }
            break;
        }

        case 'cta': {
            switch (e.hit.kind) {
                case 'ctaTitle':
                    return { blockKind: 'cta', kind: 'label' };
                case 'ctaBody':
                    return { blockKind: 'cta', kind: 'url' };
                case 'ctaButton':
                    return { blockKind: 'cta', kind: 'label' };
            }
            break;
        }
    }
};

export function normalizeBlock(block: Block): Block {
    switch (block.blockKind) {
        case 'gallery':
            return {
                id: block.id,
                blockKind: 'gallery',
                lifecycle: 'saved',
                layout: block.layout,
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                items: block.items,
                caption: block.caption ? block.caption : { en: '' },
            };
        case 'text':
            return {
                id: block.id,
                blockKind: 'text',
                lifecycle: 'saved',
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                title: block.title ? block.title : { en: '' },
                body: block.body ? block.body : { en: '' },
                variant: block.variant,
            };
        case 'cta':
            return {
                id: block.id,
                blockKind: 'cta',
                lifecycle: 'saved',
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                title: block.title ? block.title : { en: '' },
                body: block.body ? block.body : { en: '' },
                buttonLabel: block.buttonLabel ? block.buttonLabel : { en: '' },
                target: block.target ? block.target : { type: 'stream', slug: '' },
            };
    }
}

export const instantiateFromTemplate = (block: Block): Block => {
    return { ...block, lifecycle: 'draft', id: generateId('block') };
};
