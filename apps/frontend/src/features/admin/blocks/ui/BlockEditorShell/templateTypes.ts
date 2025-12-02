import type { GalleryBlock, GalleryLayout } from '@/entities/block';
import { ISODate } from '@/entities/common';

type TemplateBlock =
    | { kind: 'gallery'; layout: GalleryLayout; label: string }
    | { kind: 'text'; label: string }
    | { kind: 'cta'; label: string };

export const TEMPLATE_BLOCKS: TemplateBlock[] = [
    // --- Gallery layouts ---
    { kind: 'gallery', layout: 'single', label: 'Single' },
    { kind: 'gallery', layout: 'pairHorizontal', label: 'Pair (Horizontal)' },
    { kind: 'gallery', layout: 'pairVertical', label: 'Pair (Vertical)' },
    { kind: 'gallery', layout: 'triptychLeft', label: 'Triptych (Left)' },
    { kind: 'gallery', layout: 'triptychRight', label: 'Triptych (Right)' },
    { kind: 'gallery', layout: 'triptychHorizontal', label: 'Triptych (Horizontal)' },

    // --- Text block ---
    { kind: 'text', label: 'Text' },

    // --- CTA block ---
    { kind: 'cta', label: 'CTA' },
];
export function createGalleryTemplateBlock(layout: GalleryLayout): GalleryBlock {
    const now = new Date(0).toISOString() as ISODate; // or real now if you want

    return {
        id: `__template-${layout}`,
        blockKind: 'gallery',
        layout,
        items: [], // no art yet, so all slots will be "empty"
        dateCreated: now,
        caption: undefined,
        tags: [],
    };
}
