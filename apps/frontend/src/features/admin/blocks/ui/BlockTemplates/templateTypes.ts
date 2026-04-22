//src/features/admin/blocks/ui/BlockEditorShell/templateTypes.ts
import type {
    ComposableBlock,
    CtaBlock,
    GalleryBlock,
    GalleryLayout,
    TextBlock,
} from '@/entities/block';
import { todayISO } from '@/shared/lib/dateAndLabels/today';

type TemplateBlock =
    | { kind: 'gallery'; layout: GalleryLayout; label: string }
    | { kind: 'composable'; layout: GalleryLayout; label: string }
    | { kind: 'text'; label: string }
    | { kind: 'cta'; label: string };

// Visible template catalog. Historical `text`, `cta`, and `eventCta` entries
// were retired (no complete editor surface; homepage no longer supports
// block-level events). Composable templates were also retired: they render
// with an empty `slots: []` array and don't respond to selection in the grid
// ("ghost fragments"). All underlying factory functions remain below for
// data that already uses those kinds in streams — reachable only through
// existing block data, not through creating new ones.
export const TEMPLATE_BLOCKS: TemplateBlock[] = [
    // --- Gallery layouts ---
    { kind: 'gallery', layout: 'single', label: 'Single' },
    { kind: 'gallery', layout: 'pairHorizontal', label: 'Pair (Horizontal)' },
    { kind: 'gallery', layout: 'pairVertical', label: 'Pair (Vertical)' },
    { kind: 'gallery', layout: 'triptychLeft', label: 'Triptych (Left)' },
    { kind: 'gallery', layout: 'triptychRight', label: 'Triptych (Right)' },
    { kind: 'gallery', layout: 'triptychHorizontal', label: 'Triptych (Horizontal)' },
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
