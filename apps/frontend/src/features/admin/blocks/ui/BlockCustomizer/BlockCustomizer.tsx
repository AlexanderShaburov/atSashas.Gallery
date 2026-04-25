import type { BlockAppearance, GalleryBlock, ItemPosition } from '@/entities/block';
import { defaultImageAppearance, formatAspectRatio, LAYOUT_SCHEME } from '@/entities/block';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { GalleryBlockView } from '@/shared/ui/GalleryBlockView';
import { useCallback, useRef } from 'react';

import './BlockCustomizer.css';
import { CaptionControls } from './CaptionControls';
import { ControlPanel } from './ControlPanel';
import { useCanvasResize } from './useCanvasResize';
import { useCaptionDrag } from './useCaptionDrag';
import { useColumnDrag } from './useColumnDrag';
import { useSlotInteraction } from './useSlotInteraction';

type Props = {
    block: GalleryBlock;
    appearance: BlockAppearance;
    onChange: (app: BlockAppearance) => void;
};

export function BlockCustomizer({ block, appearance, onChange }: Props) {
    const catalog = useArtCatalog();
    const containerRef = useRef<HTMLDivElement>(null);
    const positions = LAYOUT_SCHEME[block.layout];

    // Create a block copy with the draft appearance for GalleryBlockView
    const blockWithAppearance = { ...block, appearance };

    const { dividerPositions, onDividerPointerDown } = useColumnDrag({
        columnRatios: appearance.columnRatios,
        containerRef,
        onChange: (ratios) => onChange({ ...appearance, columnRatios: ratios }),
    });

    const { onWheel, onImagePointerDown, onFrameDragPointerDown } = useSlotInteraction({
        appearance,
        onChange,
    });

    const { onCaptionPointerDown } = useCaptionDrag({ appearance, onChange });

    const { onCornerPointerDown, resizing } = useCanvasResize({
        appearance,
        containerRef,
        onChange,
    });

    const handleSnapSlot = useCallback(
        (pos: ItemPosition) => {
            const currentSlot = appearance.slots[pos];
            if (!currentSlot) return;
            onChange({
                ...appearance,
                slots: {
                    ...appearance.slots,
                    [pos]: { ...currentSlot, image: defaultImageAppearance() },
                },
            });
        },
        [appearance, onChange],
    );

    const resolveArt = (artId: string) => catalog.items[artId];

    return (
        <div className={`bcz ${resizing ? 'bcz--resizing' : ''}`} ref={containerRef}>
            <GalleryBlockView
                block={blockWithAppearance}
                resolveArt={resolveArt}
                renderArtContent={(_art, pos, picture) => {
                    const slotApp = appearance.slots[pos];
                    // Read the user-authored slot caption — NOT the art
                    // item's title. The two are distinct by design:
                    // caption is per-slot content owned by the Block
                    // Editor; title is metadata on the art catalog entry.
                    const itemForPos = block.items.find((it) => it.position === pos);
                    const slotCaptionText =
                        itemForPos?.kind === 'art' ? itemForPos.caption?.en : undefined;
                    return (
                        <>
                            <div
                                className="bcz__slot-media"
                                onWheel={(e) => onWheel(pos, e)}
                                onPointerDown={(e) => onImagePointerDown(pos, e)}
                            >
                                {picture}
                            </div>
                            <div
                                className="bcz__frame-handle"
                                onPointerDown={(e) => onFrameDragPointerDown(pos, e)}
                            >
                                <span className="bcz__frame-handle-icon">⋮⋮</span>
                            </div>
                            {slotApp?.caption?.visible && slotCaptionText && (
                                <span
                                    className="bcz__caption-overlay"
                                    style={{
                                        left: `${slotApp.caption.posX}%`,
                                        top: `${slotApp.caption.posY}%`,
                                        fontFamily: `'${slotApp.caption.style.font}', serif`,
                                        fontSize: `${slotApp.caption.style.size}px`,
                                        color: slotApp.caption.style.color,
                                    }}
                                    onPointerDown={(e) => onCaptionPointerDown(pos, e)}
                                >
                                    {slotCaptionText}
                                </span>
                            )}
                        </>
                    );
                }}
            >
                {/* Column dividers overlaid inside the grid */}
                {dividerPositions.map((pct, i) => (
                    <div
                        key={`div-${i}`}
                        className="bcz__divider"
                        style={{ left: `${pct}%` }}
                        onPointerDown={(e) => onDividerPointerDown(i, e)}
                    />
                ))}

                {/* Corner drag handle for canvas resize (top-right) */}
                <div
                    className="bcz__corner-handle"
                    onPointerDown={onCornerPointerDown}
                />

                {/* Ratio label */}
                <div className="bcz__ratio-label">
                    {formatAspectRatio(appearance.aspectRatio)}
                </div>
            </GalleryBlockView>

            <ControlPanel
                appearance={appearance}
                layout={block.layout}
                onChange={onChange}
                onSnapSlot={handleSnapSlot}
                slotPositions={positions}
            />

            <CaptionControls
                block={block}
                appearance={appearance}
                onChange={onChange}
                slotPositions={positions}
            />
        </div>
    );
}
