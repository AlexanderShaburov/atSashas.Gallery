import type { ArtItemData } from '@/entities/art';
import { type GalleryBlock, type GalleryBlockItem, type GalleryLayout, LAYOUT_SCHEME } from '@/entities/block';
import { isEventItem } from '@/shared/lib/checkers/blockItemGuards';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import Lightbox from '@/shared/ui/lightbox/Lightbox';
import { QuickView } from '@/shared/ui/QuickView';
import { useState } from 'react';
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
    const { layout, items, caption } = block;
    const catalog = useArtCatalog();
    const sorted = sortByLayout(items, layout);

    const [quickViewArt, setQuickViewArt] = useState<ArtItemData | null>(null);
    const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

    return (
        <figure className={`block ${layout}`}>
            {sorted.map((item) => {
                if (isEventItem(item)) {
                    return (
                        <GallerySlotEventView
                            key={`event-${item.position}`}
                            item={item}
                        />
                    );
                }

                const img = catalog?.items?.[item.artId];
                if (!img) return null;
                return (
                    <ArtPicture
                        key={img.id}
                        role="button"
                        sources={img.images.preview}
                        alt={img.images.alt?.en || img.title?.en || ''}
                        onClick={(e) => handleArtClick(img, e)}
                    />
                );
            })}
            {caption?.en && <figcaption>{caption.en}</figcaption>}

            {quickViewArt && anchorPoint && (
                <QuickView
                    art={quickViewArt}
                    anchorPoint={anchorPoint}
                    onClose={() => { setQuickViewArt(null); setAnchorPoint(null); }}
                    onViewFull={handleViewFull}
                />
            )}

            {lightboxSrc && (
                <Lightbox
                    src={lightboxSrc}
                    onClose={() => setLightboxSrc(null)}
                />
            )}
        </figure>
    );
}
