import type { BlockAppearance, ItemPosition } from '@/entities/block';
import { useCallback, useRef } from 'react';

type UseCaptionDragProps = {
    appearance: BlockAppearance;
    onChange: (app: BlockAppearance) => void;
};

export function useCaptionDrag({ appearance, onChange }: UseCaptionDragProps) {
    const dragging = useRef<{
        pos: ItemPosition;
        startX: number;
        startY: number;
        startPosX: number;
        startPosY: number;
    } | null>(null);

    const onCaptionPointerDown = useCallback(
        (pos: ItemPosition, e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            const slot = appearance.slots[pos];
            if (!slot?.caption) return;

            dragging.current = {
                pos,
                startX: e.clientX,
                startY: e.clientY,
                startPosX: slot.caption.posX,
                startPosY: slot.caption.posY,
            };

            const slotEl = (e.target as HTMLElement).closest('.bcz__slot');
            if (!slotEl) return;
            const rect = slotEl.getBoundingClientRect();

            const onMove = (me: PointerEvent) => {
                if (!dragging.current) return;
                const dx = me.clientX - dragging.current.startX;
                const dy = me.clientY - dragging.current.startY;
                const newPosX = Math.max(
                    0,
                    Math.min(100, dragging.current.startPosX + (dx / rect.width) * 100),
                );
                const newPosY = Math.max(
                    0,
                    Math.min(100, dragging.current.startPosY + (dy / rect.height) * 100),
                );

                const currentSlot = appearance.slots[dragging.current.pos];
                if (!currentSlot?.caption) return;

                onChange({
                    ...appearance,
                    slots: {
                        ...appearance.slots,
                        [dragging.current.pos]: {
                            ...currentSlot,
                            caption: { ...currentSlot.caption, posX: newPosX, posY: newPosY },
                        },
                    },
                });
            };

            const onUp = () => {
                dragging.current = null;
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [appearance, onChange],
    );

    return { onCaptionPointerDown };
}
