import type { BlockAppearance } from '@/entities/block';
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO, snapAspectRatio } from '@/entities/block';
import { useCallback, useRef } from 'react';

type UseCanvasResizeProps = {
    appearance: BlockAppearance;
    containerRef: React.RefObject<HTMLElement | null>;
    onChange: (app: BlockAppearance) => void;
};

export function useCanvasResize({ appearance, containerRef, onChange }: UseCanvasResizeProps) {
    const dragging = useRef(false);
    const latestRatio = useRef(appearance.aspectRatio);
    latestRatio.current = appearance.aspectRatio;

    const onCornerPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            dragging.current = true;

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const containerWidth = rect.width;

            const onMove = (me: PointerEvent) => {
                if (!dragging.current) return;
                // Height = distance from top of container to pointer Y
                const pointerY = me.clientY - rect.top;
                const height = Math.max(50, pointerY);
                const rawRatio = containerWidth / height;
                const clampedRatio = Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, rawRatio));
                latestRatio.current = clampedRatio;
                onChange({ ...appearance, aspectRatio: clampedRatio });
            };

            const onUp = () => {
                dragging.current = false;
                // Snap to nearest preset on release
                const current = latestRatio.current;
                if (typeof current === 'number') {
                    onChange({ ...appearance, aspectRatio: snapAspectRatio(current) });
                }
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [appearance, containerRef, onChange],
    );

    return { onCornerPointerDown };
}
