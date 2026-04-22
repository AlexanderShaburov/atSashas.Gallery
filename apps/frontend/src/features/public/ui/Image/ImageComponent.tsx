import type { ArtItemData } from '@/entities/art';
import type { GalleryBlock, ItemPosition } from '@/entities/block';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { GalleryBlockView } from '@/shared/ui/GalleryBlockView';
import Lightbox from '@/shared/ui/lightbox/Lightbox';
import { QuickView } from '@/shared/ui/QuickView';
import { useState } from 'react';

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
  const catalog = useArtCatalog();
  const [quickViewArt, setQuickViewArt] = useState<ArtItemData | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const resolveArt = (artId: string) => catalog?.items?.[artId];

  const handleSlotClick = (pos: ItemPosition, e: React.MouseEvent) => {
    const item = block.items.find((i) => i.position === pos);
    if (!item) return;
    const art = resolveArt(item.artId);
    if (!art) return;
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
    <>
      <GalleryBlockView
        block={block}
        resolveArt={resolveArt}
        onSlotClick={handleSlotClick}
      />

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

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
