import type { BlockAppearance, ItemPosition, SlotAppearance } from '@/entities/block';
import { defaultSlotAppearance, MAX_SCALE, MIN_SCALE } from '@/entities/block';
import { useCallback, useRef } from 'react';

type Props = {
    appearance: BlockAppearance;
    onChange: (app: BlockAppearance) => void;
};

function updateSlot(
    appearance: BlockAppearance,
    pos: ItemPosition,
    updater: (slot: SlotAppearance) => SlotAppearance,
): BlockAppearance {
    const current = appearance.slots[pos] ?? defaultSlotAppearance();
    return {
        ...appearance,
        slots: { ...appearance.slots, [pos]: updater(current) },
    };
}

export function useSlotInteraction({ appearance, onChange }: Props) {
    const dragState = useRef<{
        pos: ItemPosition;
        startX: number;
        startY: number;
        startOffsetX: number;
        startOffsetY: number;
    } | null>(null);

    // Scroll wheel → zoom (0.5x to 2.0x)
    const onWheel = useCallback(
        (pos: ItemPosition, e: React.WheelEvent) => {
            e.preventDefault();
            const slot = appearance.slots[pos] ?? defaultSlotAppearance();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, slot.image.scale + delta));
            onChange(
                updateSlot(appearance, pos, (s) => ({
                    ...s,
                    image: { ...s.image, scale: newScale },
                })),
            );
        },
        [appearance, onChange],
    );

    // Pointer drag on image → pan (offsetX/offsetY in %)
    const onImagePointerDown = useCallback(
        (pos: ItemPosition, e: React.PointerEvent) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            const slot = appearance.slots[pos] ?? defaultSlotAppearance();
            dragState.current = {
                pos,
                startX: e.clientX,
                startY: e.clientY,
                startOffsetX: slot.image.offsetX,
                startOffsetY: slot.image.offsetY,
            };

            const onMove = (me: PointerEvent) => {
                if (!dragState.current) return;
                const dx = (me.clientX - dragState.current.startX) / 3;
                const dy = (me.clientY - dragState.current.startY) / 3;
                onChange(
                    updateSlot(appearance, dragState.current.pos, (s) => ({
                        ...s,
                        image: {
                            ...s.image,
                            offsetX: dragState.current!.startOffsetX + dx,
                            offsetY: dragState.current!.startOffsetY + dy,
                        },
                    })),
                );
            };

            const onUp = () => {
                dragState.current = null;
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [appearance, onChange],
    );

    // Pointer drag on frame handle → frameOffsetY (px)
    const onFrameDragPointerDown = useCallback(
        (pos: ItemPosition, e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            const slot = appearance.slots[pos] ?? defaultSlotAppearance();
            const startY = e.clientY;
            const startOffset = slot.frameOffsetY;

            const onMove = (me: PointerEvent) => {
                const dy = me.clientY - startY;
                onChange(
                    updateSlot(appearance, pos, (s) => ({
                        ...s,
                        frameOffsetY: startOffset + dy,
                    })),
                );
            };

            const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [appearance, onChange],
    );

    return { onWheel, onImagePointerDown, onFrameDragPointerDown };
}
