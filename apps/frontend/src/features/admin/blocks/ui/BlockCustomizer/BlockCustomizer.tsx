import type { BlockAppearance, GalleryBlock, ItemPosition } from '@/entities/block';
import { defaultImageAppearance, LAYOUT_SCHEME } from '@/entities/block';
import {
    blockGridStyle,
    slotImageStyle,
    slotWrapperStyle,
} from '@/features/public/ui/Image/applyAppearanceStyles';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import { useCallback, useRef } from 'react';

import './BlockCustomizer.css';
import { CaptionControls } from './CaptionControls';
import { ControlPanel } from './ControlPanel';
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

    const gridStyle = blockGridStyle(appearance);

    return (
        <div className="bcz">
            <div className="bcz__grid" ref={containerRef} style={gridStyle}>
                {positions.map((pos) => {
                    const slotApp = appearance.slots[pos];
                    const item = block.items.find((i) => i.position === pos);
                    const art = item && item.kind === 'art' ? catalog.items[item.artId] : undefined;

                    return (
                        <div key={pos} className="bcz__slot" style={slotWrapperStyle(slotApp)}>
                            <div
                                className="bcz__frame-handle"
                                onPointerDown={(e) => onFrameDragPointerDown(pos, e)}
                            />
                            {art ? (
                                <div
                                    className="bcz__slot-media"
                                    onWheel={(e) => onWheel(pos, e)}
                                    onPointerDown={(e) => onImagePointerDown(pos, e)}
                                >
                                    <ArtPicture
                                        sources={art.images.preview}
                                        alt={art.title?.en ?? ''}
                                        imgStyle={slotImageStyle(slotApp)}
                                    />
                                </div>
                            ) : (
                                <div className="bcz__slot-empty">Empty</div>
                            )}
                            {slotApp?.caption?.visible &&
                                item?.kind === 'art' &&
                                item.caption?.en && (
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
                                        {item.caption.en}
                                    </span>
                                )}
                        </div>
                    );
                })}

                {/* Column dividers */}
                {dividerPositions.map((pct, i) => (
                    <div
                        key={`div-${i}`}
                        className="bcz__divider"
                        style={{ left: `${pct}%` }}
                        onPointerDown={(e) => onDividerPointerDown(i, e)}
                    />
                ))}
            </div>

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
