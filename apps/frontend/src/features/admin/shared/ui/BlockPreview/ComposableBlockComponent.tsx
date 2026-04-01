// src/features/admin/shared/ui/BlockPreview/ComposableBlockComponent.tsx

import type { BlockHitEvent, BlockParent, ComposableBlock, ItemPosition } from '@/entities/block';
import { Hit } from '@/entities/block';
import type { RenderableResolver } from '@/entities/renderable';
import { useResolveArt } from '@/shared/ArtCatalogProvider/CatalogHook';
import { ComposableBlockView } from '@/shared/ui/ComposableBlockView';

type Props = {
  item: ComposableBlock;
  onHit: (e: BlockHitEvent) => void;
  parent: BlockParent;
};

const EMPTY_RESOLVER: RenderableResolver = {
  resolveArt: () => undefined,
  resolveMedia: () => undefined,
  resolveTextVisual: () => undefined,
};

export function ComposableBlockComponent({ item, onHit, parent }: Props) {
  const resolveArt = useResolveArt();

  const resolver: RenderableResolver = {
    resolveArt,
    resolveMedia: () => undefined, // TODO: connect when media store available
    resolveTextVisual: () => undefined, // TODO: connect when textVisual store available
  };

  const handleSlotClick = (pos: ItemPosition, e: React.MouseEvent) => {
    onHit({
      block: item,
      hit: Hit.galleryImage(pos),
      nativeEvent: e as React.MouseEvent<HTMLElement>,
    });
  };

  const renderEmptySlot = (pos: ItemPosition) => (
    <span style={{ fontSize: '0.8rem' }}>+ {pos}</span>
  );

  const isThumbnail = parent === 'grid' || parent === 'streamEditor';

  return (
    <ComposableBlockView
      block={item}
      resolver={item.isTemplate ? EMPTY_RESOLVER : resolver}
      onSlotClick={parent === 'editor' ? handleSlotClick : undefined}
      renderEmptySlot={parent === 'editor' ? renderEmptySlot : undefined}
      className={isThumbnail ? 'block--thumb' : undefined}
    />
  );
}
