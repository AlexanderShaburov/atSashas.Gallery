import type { Block, ItemPosition } from './block.types';

export interface BlockHitEvent {
    block: Block;
    hit: BlockHit;
    nativeEvent: React.MouseEvent<HTMLElement>;
}

export type BlockHit =
    // Gallery block
    | { blockKind: 'gallery'; kind: 'image'; slot: ItemPosition }
    | { blockKind: 'gallery'; kind: 'imageCaption'; slot: ItemPosition }
    | { blockKind: 'gallery'; kind: 'blockCaption' }

    // Text block
    | { blockKind: 'text'; kind: 'textTitle' }
    | { blockKind: 'text'; kind: 'textBody' }

    // CTA block
    | { blockKind: 'cta'; kind: 'ctaTitle' }
    | { blockKind: 'cta'; kind: 'ctaBody' }
    | { blockKind: 'cta'; kind: 'ctaButton' };

export const Hit = {
    galleryImage: (slot: ItemPosition): BlockHit => ({
        blockKind: 'gallery',
        kind: 'image',
        slot,
    }),
    galleryCaption: (slot: ItemPosition): BlockHit => ({
        blockKind: 'gallery',
        kind: 'imageCaption',
        slot,
    }),
    galleryBlockCaption: (): BlockHit => ({
        blockKind: 'gallery',
        kind: 'blockCaption',
    }),
    textTitle: (): BlockHit => ({
        blockKind: 'text',
        kind: 'textTitle',
    }),
    textBody: (): BlockHit => ({
        blockKind: 'text',
        kind: 'textBody',
    }),
    ctaTitle: (): BlockHit => ({
        blockKind: 'cta',
        kind: 'ctaTitle',
    }),
    ctaBody: (): BlockHit => ({
        blockKind: 'cta',
        kind: 'ctaBody',
    }),
    ctaButton: (): BlockHit => ({
        blockKind: 'cta',
        kind: 'ctaButton',
    }),
};
