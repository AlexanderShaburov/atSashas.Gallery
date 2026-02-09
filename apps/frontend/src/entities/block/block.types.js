// src/entities/block/block.types.ts
export const CTA_TYPES = ['stream', 'external', 'event'];
export const BLOCK_KINDS = ['gallery', 'text', 'cta'];
export const GALLERY_LAYOUTS = [
    'single',
    'pairHorizontal',
    'pairVertical',
    'triptychLeft',
    'triptychRight',
    'triptychHorizontal',
];
export const LAYOUT_SCHEME = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
    triptychLeft: ['LBC', 'LUC', 'Right'],
    triptychRight: ['Left', 'RUC', 'RBC'],
};
