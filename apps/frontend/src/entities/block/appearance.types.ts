import type { ItemPosition } from './block.types';

export type ImageAppearance = {
    scale: number; // 0.5–2.0, default 1.0
    offsetX: number; // pan X in %, default 0
    offsetY: number; // pan Y in %, default 0
};

export type CaptionStyle = {
    font: string; // Google Font family name
    size: number; // 10–48 px
    color: string; // hex color string
};

export type SlotCaptionAppearance = {
    visible: boolean; // default false
    posX: number; // % within slot
    posY: number; // % within slot
    style: CaptionStyle;
};

export type SlotAppearance = {
    image: ImageAppearance;
    frameOffsetY: number; // px, default 0
    caption?: SlotCaptionAppearance;
};

export type BlockCaptionAppearance = {
    position: 'above' | 'below';
    style: CaptionStyle;
};

export type BlockAppearance = {
    columnRatios: number[]; // sum to 1.0
    verticalAlign: 'top' | 'center' | 'bottom';
    gap: number; // -50 to +50 px
    slots: Partial<Record<ItemPosition, SlotAppearance>>;
    blockCaption?: BlockCaptionAppearance;
};
