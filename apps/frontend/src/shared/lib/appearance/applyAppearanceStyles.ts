import type { BlockAppearance, SlotAppearance } from '@/entities/block';
import type { CSSProperties } from 'react';

/** Compute CSS grid style for the block container from appearance. */
export function blockGridStyle(appearance: BlockAppearance | undefined): CSSProperties | undefined {
    if (!appearance) return undefined;
    const cols = appearance.columnRatios.map((r) => `${r}fr`).join(' ');
    const ratio = appearance.aspectRatio;
    return {
        gridTemplateColumns: cols,
        gap: `${appearance.gap}px`,
        alignItems:
            appearance.verticalAlign === 'center'
                ? 'center'
                : appearance.verticalAlign === 'bottom'
                  ? 'end'
                  : 'start',
        aspectRatio: ratio === 'auto' ? undefined : `${ratio}`,
        overflow: ratio === 'auto' ? undefined : 'hidden',
    };
}

/** Compute inline style for a slot wrapper div. */
export function slotWrapperStyle(slot: SlotAppearance | undefined): CSSProperties | undefined {
    if (!slot || slot.frameOffsetY === 0) return undefined;
    return { transform: `translateY(${slot.frameOffsetY}px)` };
}

/** Compute inline style for the image inside a slot. */
export function slotImageStyle(slot: SlotAppearance | undefined): CSSProperties | undefined {
    if (!slot) return undefined;
    const { scale, offsetX, offsetY } = slot.image;
    if (scale === 1 && offsetX === 0 && offsetY === 0) return undefined;
    return {
        transform: `scale(${scale}) translate(${offsetX}%, ${offsetY}%)`,
        transformOrigin: 'center center',
    };
}
