import { MIN_COLUMN_RATIO } from '@/entities/block';
import { useCallback, useRef } from 'react';

type UseColumnDragProps = {
    columnRatios: number[];
    containerRef: React.RefObject<HTMLElement | null>;
    onChange: (ratios: number[]) => void;
};

export function useColumnDrag({ columnRatios, containerRef, onChange }: UseColumnDragProps) {
    const dragging = useRef<number | null>(null);

    const onDividerPointerDown = useCallback(
        (index: number, e: React.PointerEvent) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            dragging.current = index;

            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();

            const onMove = (me: PointerEvent) => {
                if (dragging.current === null) return;
                const relX = me.clientX - rect.left;
                const totalWidth = rect.width;

                // Compute new split: ratio = position of divider relative to container
                const newRatios = [...columnRatios];
                const dividerRatio = Math.max(
                    MIN_COLUMN_RATIO * (index + 1),
                    Math.min(
                        relX / totalWidth,
                        1 - MIN_COLUMN_RATIO * (newRatios.length - index - 1),
                    ),
                );

                // Sum of ratios before the divider
                const oldLeftSum = newRatios.slice(0, index + 1).reduce((a, b) => a + b, 0);
                const leftScale = dividerRatio / oldLeftSum;
                for (let i = 0; i <= index; i++) {
                    newRatios[i] = Math.max(MIN_COLUMN_RATIO, (newRatios[i] ?? 0) * leftScale);
                }

                // Remaining space for right side
                const leftUsed = newRatios.slice(0, index + 1).reduce((a, b) => a + b, 0);
                const rightRemaining = 1 - leftUsed;
                const oldRightSum = columnRatios.slice(index + 1).reduce((a, b) => a + b, 0);
                if (oldRightSum > 0) {
                    const rightScale = rightRemaining / oldRightSum;
                    for (let i = index + 1; i < newRatios.length; i++) {
                        newRatios[i] = Math.max(MIN_COLUMN_RATIO, (newRatios[i] ?? 0) * rightScale);
                    }
                }

                onChange(newRatios);
            };

            const onUp = () => {
                dragging.current = null;
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        },
        [columnRatios, containerRef, onChange],
    );

    // Compute divider positions as cumulative percentages
    const dividerPositions: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < columnRatios.length - 1; i++) {
        cumulative += columnRatios[i] ?? 0;
        dividerPositions.push(cumulative * 100);
    }

    return { dividerPositions, onDividerPointerDown };
}
