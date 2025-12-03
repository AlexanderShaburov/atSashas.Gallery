import type { CtaBlock, GalleryBlock, GalleryLayout, TextBlock } from '@/entities/block';
import { todayISO } from '@/shared/lib/date/Today';

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
    return {
        id: `__template-gallery-${layout}`,
        blockKind: 'gallery',
        layout,
        items: [],
        dateCreated: todayISO(),
        caption: undefined,
        tags: [],
    };
}
export function createTextTemplateBlock(): TextBlock {
    return {
        id: `__template-text`,
        blockKind: 'text',
        dateCreated: todayISO(),
        caption: { en: 'Caption place here' },
        title: { en: 'Template' },
        body: { en: 'Place your text here' },
    };
}

export function createCtaTemplateBlock(): CtaBlock {
    return {
        id: `__template-cta`,
        blockKind: 'cta',
        dateCreated: todayISO(),
        caption: { en: 'Caption place here' },
        title: { en: 'Action title here' },
        body: { en: 'Description here' },
        buttonLabel: { en: 'Button label' },
        target: { type: 'event', eventId: '' },
    };
}
