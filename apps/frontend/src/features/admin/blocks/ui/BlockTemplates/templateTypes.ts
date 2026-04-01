//src/features/admin/blocks/ui/BlockEditorShell/templateTypes.ts
import type {
    ComposableBlock,
    CtaBlock,
    EventCtaBlock,
    GalleryBlock,
    GalleryLayout,
    TextBlock,
} from '@/entities/block';
import { todayISO } from '@/shared/lib/dateAndLabels/today';

type TemplateBlock =
    | { kind: 'gallery'; layout: GalleryLayout; label: string }
    | { kind: 'composable'; layout: GalleryLayout; label: string }
    | { kind: 'text'; label: string }
    | { kind: 'cta'; label: string }
    | { kind: 'eventCta'; label: string };

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

    // --- Event CTA block ---
    { kind: 'eventCta', label: 'Event CTA' },

    // --- Composable block (mixed content) ---
    { kind: 'composable', layout: 'single', label: 'Composable (Single)' },
    { kind: 'composable', layout: 'pairHorizontal', label: 'Composable (Pair)' },
    { kind: 'composable', layout: 'triptychHorizontal', label: 'Composable (Triptych)' },
];
export function createGalleryTemplateBlock(layout: GalleryLayout): GalleryBlock {
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
export function createTextTemplateBlock(): TextBlock {
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

export function createCtaTemplateBlock(): CtaBlock {
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

export function createEventCtaTemplateBlock(): EventCtaBlock {
    return {
        id: '__template-eventCta',
        blockKind: 'eventCta',
        lifecycle: 'template',
        dateCreated: todayISO(),
        eventId: '',
        buttonLabel: { en: 'Sign up' },
    };
}

export function createComposableTemplateBlock(layout: GalleryLayout): ComposableBlock {
    return {
        id: `__template-composable-${layout}`,
        blockKind: 'composable',
        lifecycle: 'template',
        layout: layout,
        slots: [],
        dateCreated: todayISO(),
        tags: [],
    };
}
