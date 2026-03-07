import type { GalleryLayout, ItemPosition } from './block.types';
import { LAYOUT_SCHEME } from './block.types';

import type {
    BlockAppearance,
    BlockCaptionAppearance,
    CaptionStyle,
    ImageAppearance,
    SlotAppearance,
    SlotCaptionAppearance,
} from './appearance.types';

// ── Named constants ──────────────────────────────────────────────

export const DEFAULT_FONT = 'Inter';
export const DEFAULT_CAPTION_SIZE = 16;
export const DEFAULT_CAPTION_COLOR = '#1e1e1c';
export const DEFAULT_GAP = 6;
export const DEFAULT_SCALE = 1.0;

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2.0;
export const MIN_GAP = -50;
export const MAX_GAP = 50;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 48;
export const MIN_COLUMN_RATIO = 0.125;

// ── Column count per layout ─────────────────────────────────────

const LAYOUT_COLUMNS: Record<GalleryLayout, number> = {
    single: 1,
    pairHorizontal: 2,
    pairVertical: 1,
    triptychLeft: 2,
    triptychRight: 2,
    triptychHorizontal: 3,
};

// ── Factory functions ───────────────────────────────────────────

export function defaultImageAppearance(): ImageAppearance {
    return { scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 };
}

export function defaultCaptionStyle(): CaptionStyle {
    return { font: DEFAULT_FONT, size: DEFAULT_CAPTION_SIZE, color: DEFAULT_CAPTION_COLOR };
}

export function defaultSlotCaptionAppearance(): SlotCaptionAppearance {
    return { visible: false, posX: 50, posY: 90, style: defaultCaptionStyle() };
}

export function defaultSlotAppearance(): SlotAppearance {
    return { image: defaultImageAppearance(), frameOffsetY: 0 };
}

export function defaultBlockCaptionAppearance(): BlockCaptionAppearance {
    return { position: 'below', style: defaultCaptionStyle() };
}

export function defaultBlockAppearance(layout: GalleryLayout): BlockAppearance {
    const columnCount = LAYOUT_COLUMNS[layout];
    const ratio = 1 / columnCount;
    const columnRatios = Array.from({ length: columnCount }, () => ratio);

    const positions = LAYOUT_SCHEME[layout] as readonly ItemPosition[];
    const slots: Partial<Record<ItemPosition, SlotAppearance>> = {};
    for (const pos of positions) {
        slots[pos] = defaultSlotAppearance();
    }

    return {
        columnRatios,
        verticalAlign: 'center',
        gap: DEFAULT_GAP,
        slots,
    };
}

// ── Comparison ──────────────────────────────────────────────────

export function isDefaultAppearance(
    app: BlockAppearance | undefined,
    layout: GalleryLayout,
): boolean {
    if (!app) return true;
    const def = defaultBlockAppearance(layout);
    if (app.verticalAlign !== def.verticalAlign) return false;
    if (app.gap !== def.gap) return false;
    if (app.blockCaption !== def.blockCaption) return false;
    if (app.columnRatios.length !== def.columnRatios.length) return false;
    if (app.columnRatios.some((r, i) => r !== def.columnRatios[i])) return false;
    const defPositions = Object.keys(def.slots) as ItemPosition[];
    const appPositions = Object.keys(app.slots) as ItemPosition[];
    if (defPositions.length !== appPositions.length) return false;
    for (const pos of defPositions) {
        const as = app.slots[pos];
        const ds = def.slots[pos];
        if (!as || !ds) return false;
        if (as.frameOffsetY !== ds.frameOffsetY) return false;
        if (as.image.scale !== ds.image.scale) return false;
        if (as.image.offsetX !== ds.image.offsetX) return false;
        if (as.image.offsetY !== ds.image.offsetY) return false;
        if (as.caption !== ds.caption) return false;
    }
    return true;
}
