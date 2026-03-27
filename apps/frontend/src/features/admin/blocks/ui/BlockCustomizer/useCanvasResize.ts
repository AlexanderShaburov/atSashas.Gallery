import type { BlockAppearance } from '@/entities/block';
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO, snapAspectRatio } from '@/entities/block';
import { useCallback, useRef, useState } from 'react';

type UseCanvasResizeProps = {
    appearance: BlockAppearance;
    containerRef: React.RefObject<HTMLElement | null>;
    onChange: (app: BlockAppearance) => void;
};

export function useCanvasResize({ appearance, containerRef, onChange }: UseCanvasResizeProps) {
    const dragging = useRef(false);
    const [resizing, setResizing] = useState(false);
    const latestRatio = useRef(appearance.aspectRatio);
    latestRatio.current = appearance.aspectRatio;
    const latestAppearance = useRef(appearance);
    latestAppearance.current = appearance;

    const onCornerPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            dragging.current = true;
            setResizing(true);

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const style = getComputedStyle(container);
            const padLeft = parseFloat(style.paddingLeft);
            const padRight = parseFloat(style.paddingRight);
            const containerWidth = rect.width - padLeft - padRight;
            const startY = e.clientY;
            const currentRatio = typeof latestRatio.current === 'number'
                ? latestRatio.current
                : containerWidth / rect.height;
            const startHeight = containerWidth / currentRatio;

            const onMove = (me: PointerEvent) => {
                if (!dragging.current) return;
                // Drag down = taller (lower ratio), drag up = shorter (higher ratio)
                const deltaY = me.clientY - startY;
                const height = Math.max(50, startHeight + deltaY);
                const rawRatio = containerWidth / height;
                const clampedRatio = Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, rawRatio));
                latestRatio.current = clampedRatio;
                onChange({ ...latestAppearance.current, aspectRatio: clampedRatio });
            };

            const onUp = () => {
                dragging.current = false;
                setResizing(false);
                // Snap to nearest preset on release
                const current = latestRatio.current;
                if (typeof current === 'number') {
                    onChange({ ...latestAppearance.current, aspectRatio: snapAspectRatio(current) });
                }
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [containerRef, onChange],
    );

    return { onCornerPointerDown, resizing };
}
