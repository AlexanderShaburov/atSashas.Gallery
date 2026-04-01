import type { ArtItemData } from '@/entities/art';
import type { ComposableBlock, ItemPosition } from '@/entities/block';
import type { RenderableResolver } from '@/entities/renderable';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ComposableBlockView } from '@/shared/ui/ComposableBlockView';
import Lightbox from '@/shared/ui/lightbox/Lightbox';
import { QuickView } from '@/shared/ui/QuickView';
import { useState } from 'react';

import { getMediaItem } from '../../api/mediaItemsModule';
import { getTextVisual } from '../../api/textVisualsModule';

type Props = { block: ComposableBlock };

export default function ComposableBlockPublic({ block }: Props) {
  const catalog = useArtCatalog();
  const [quickViewArt, setQuickViewArt] = useState<ArtItemData | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const resolver: RenderableResolver = {
    resolveArt: (artId) => catalog?.items?.[artId],
    resolveMedia: (mediaId) => getMediaItem(mediaId),
    resolveTextVisual: (tvId) => getTextVisual(tvId),
  };

  const handleSlotClick = (pos: ItemPosition, e: React.MouseEvent) => {
    const slot = block.slots.find((s) => s.position === pos);
    if (!slot || slot.content.kind !== 'art') return;
    const art = resolver.resolveArt(slot.content.artId);
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
      <ComposableBlockView block={block} resolver={resolver} onSlotClick={handleSlotClick} />

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
