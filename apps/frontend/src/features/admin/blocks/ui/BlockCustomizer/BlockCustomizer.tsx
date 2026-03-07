import type { BlockAppearance, GalleryBlock, ItemPosition } from '@/entities/block';
import { LAYOUT_SCHEME } from '@/entities/block';
import {
    blockGridStyle,
    slotImageStyle,
    slotWrapperStyle,
} from '@/features/public/ui/Image/applyAppearanceStyles';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import { useRef } from 'react';

import { useColumnDrag } from './useColumnDrag';
import './BlockCustomizer.css';

type Props = {
    block: GalleryBlock;
    appearance: BlockAppearance;
    onChange: (app: BlockAppearance) => void;
};

export function BlockCustomizer({ block, appearance, onChange }: Props) {
    const catalog = useArtCatalog();
    const containerRef = useRef<HTMLDivElement>(null);
    const positions = LAYOUT_SCHEME[block.layout] as readonly string[];

    const { dividerPositions, onDividerPointerDown } = useColumnDrag({
        columnRatios: appearance.columnRatios,
        containerRef,
        onChange: (ratios) => onChange({ ...appearance, columnRatios: ratios }),
    });

    const gridStyle = blockGridStyle(appearance);

    return (
        <div className="bcz">
            <div className="bcz__grid" ref={containerRef} style={gridStyle}>
                {positions.map((pos) => {
                    const slotApp = appearance.slots[pos as ItemPosition];
                    const item = block.items.find((i) => i.position === pos);
                    const art =
                        item && item.kind === 'art'
                            ? catalog.items[item.artId]
                            : undefined;

                    return (
                        <div
                            key={pos}
                            className="bcz__slot"
                            style={slotWrapperStyle(slotApp)}
                        >
                            {art ? (
                                <ArtPicture
                                    sources={art.images.preview}
                                    alt={art.title?.en ?? ''}
                                    imgStyle={slotImageStyle(slotApp)}
                                />
                            ) : (
                                <div className="bcz__slot-empty">Empty</div>
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
        </div>
    );
}
