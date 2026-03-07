import type { ArtItemData } from '@/entities/art';
import {
    type GalleryBlock,
    type GalleryBlockItem,
    type GalleryLayout,
    type ItemPosition,
    LAYOUT_SCHEME,
} from '@/entities/block';
import { isEventItem } from '@/shared/lib/checkers/blockItemGuards';
import { loadGoogleFont } from '@/shared/lib/fonts/loadGoogleFont';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import Lightbox from '@/shared/ui/lightbox/Lightbox';
import { QuickView } from '@/shared/ui/QuickView';
import { useEffect, useState } from 'react';

import { blockGridStyle, slotImageStyle, slotWrapperStyle } from '@/shared/lib/appearance/applyAppearanceStyles';
import { GallerySlotEventView } from './GallerySlotEventView';

function sortByLayout(items: GalleryBlockItem[], layout: GalleryLayout): GalleryBlockItem[] {
    const order: readonly string[] = LAYOUT_SCHEME[layout];
    return [...items].sort((a, b) => {
        const ai = order.indexOf(a.position);
        const bi = order.indexOf(b.position);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
}

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, items, caption, appearance } = block;
    const catalog = useArtCatalog();
    const sorted = sortByLayout(items, layout);
    const positions: readonly string[] = LAYOUT_SCHEME[layout];

    const [quickViewArt, setQuickViewArt] = useState<ArtItemData | null>(null);
    const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    // Load Google Fonts used by appearance captions
    useEffect(() => {
        if (!appearance) return;
        const fonts = new Set<string>();
        if (appearance.blockCaption) fonts.add(appearance.blockCaption.style.font);
        for (const pos of positions) {
            const slot = appearance.slots[pos as ItemPosition];
            if (slot?.caption?.visible) fonts.add(slot.caption.style.font);
        }
        fonts.forEach(loadGoogleFont);
    }, [appearance, positions]);

    const handleArtClick = (art: ArtItemData, e: React.MouseEvent<HTMLElement>) => {
        setAnchorPoint({ x: e.clientX + window.scrollX, y: e.clientY + window.scrollY });
        setQuickViewArt(art);
    };

    const handleViewFull = () => {
        if (!quickViewArt) return;
        setQuickViewArt(null);
        setAnchorPoint(null);
        setLightboxSrc(quickViewArt.images.full);
    };

    const gridStyle = blockGridStyle(appearance);
    const figureClass = `block ${layout}${appearance ? ' block--custom' : ''}`;

    const captionStyle = appearance?.blockCaption
        ? {
              fontFamily: `'${appearance.blockCaption.style.font}', serif`,
              fontSize: `${appearance.blockCaption.style.size}px`,
              color: appearance.blockCaption.style.color,
          }
        : undefined;

    const captionAbove =
        appearance?.blockCaption?.position === 'above' && caption?.en ? (
            <figcaption style={captionStyle}>{caption.en}</figcaption>
        ) : null;

    const captionBelow =
        (!appearance?.blockCaption || appearance.blockCaption.position === 'below') &&
        caption?.en ? (
            <figcaption style={captionStyle}>{caption.en}</figcaption>
        ) : null;

    return (
        <figure className={figureClass} style={gridStyle}>
            {captionAbove}

            {sorted.map((item) => {
                const slotApp = appearance?.slots[item.position as ItemPosition];

                if (isEventItem(item)) {
                    return (
                        <div
                            key={`event-${item.position}`}
                            className="block__slot"
                            style={slotWrapperStyle(slotApp)}
                        >
                            <GallerySlotEventView item={item} />
                        </div>
                    );
                }

                const img = catalog?.items?.[item.artId];
                if (!img) return null;

                const slotCaption =
                    slotApp?.caption?.visible && img.title?.en ? (
                        <span
                            className="block__slot-caption"
                            style={{
                                left: `${slotApp.caption.posX}%`,
                                top: `${slotApp.caption.posY}%`,
                                fontFamily: `'${slotApp.caption.style.font}', serif`,
                                fontSize: `${slotApp.caption.style.size}px`,
                                color: slotApp.caption.style.color,
                            }}
                        >
                            {img.title.en}
                        </span>
                    ) : null;

                return (
                    <div
                        key={img.id}
                        className="block__slot"
                        style={slotWrapperStyle(slotApp)}
                    >
                        <ArtPicture
                            role="button"
                            sources={img.images.preview}
                            alt={img.images.alt?.en || img.title?.en || ''}
                            onClick={(e) => handleArtClick(img, e)}
                            imgStyle={slotImageStyle(slotApp)}
                        />
                        {slotCaption}
                    </div>
                );
            })}

            {captionBelow}

            {quickViewArt && anchorPoint && (
                <QuickView
                    art={quickViewArt}
                    anchorPoint={anchorPoint}
                    onClose={() => {
                        setQuickViewArt(null);
                        setAnchorPoint(null);
                    }}
                    onViewFull={handleViewFull}
                />
            )}

            {lightboxSrc && (
                <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </figure>
    );
}
