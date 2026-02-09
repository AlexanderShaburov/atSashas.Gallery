import { todayISO } from '@/shared/lib/dateAndLabels/today';
export const TEMPLATE_BLOCKS = [
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
export function createGalleryTemplateBlock(layout) {
    return {
        id: `__template-gallery-${layout}`,
        blockKind: 'gallery',
        lifecycle: 'template',
        layout: layout,
        items: [],
        dateCreated: todayISO(),
        caption: undefined,
        tags: [],
    };
}
export function createTextTemplateBlock() {
    return {
        id: `__template-text`,
        blockKind: 'text',
        lifecycle: 'template',
        dateCreated: todayISO(),
        caption: { en: 'Caption' },
        title: { en: 'Place your title here' },
        body: { en: 'Place your text here' },
    };
}
export function createCtaTemplateBlock() {
    return {
        id: `__template-cta`,
        blockKind: 'cta',
        lifecycle: 'template',
        dateCreated: todayISO(),
        caption: { en: 'Caption' },
        title: { en: 'Action title here' },
        body: { en: 'Description here' },
        buttonLabel: { en: 'Button label' },
        target: { type: 'event', eventId: '' },
    };
}
