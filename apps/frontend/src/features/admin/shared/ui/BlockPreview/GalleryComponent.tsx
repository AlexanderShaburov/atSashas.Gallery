// src/features/admin/shared/ui/BlockPreview/GalleryComponent.tsx

import type { BlockHitEvent, BlockParent, GalleryBlock, ItemPosition } from '@/entities/block';
import { Hit } from '@/entities/block';
import { useResolveArtAdaptive } from '@/shared/ArtCatalogProvider/useResolveArtAdaptive';
import { GalleryBlockView } from '@/shared/ui/GalleryBlockView';

type Props = {
    item: GalleryBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    readOnly?: boolean;
};

export function GalleryComponent({ item, onHit, readOnly }: Props) {
    const resolveArt = useResolveArtAdaptive();

    const handleSlotClick = (pos: ItemPosition, e: React.MouseEvent) => {
        if (readOnly) return;
        onHit({
            block: item,
            hit: Hit.galleryImage(pos),
            nativeEvent: e as React.MouseEvent<HTMLElement>,
        });
    };

    return (
        <GalleryBlockView
            block={item}
            resolveArt={resolveArt}
            onSlotClick={handleSlotClick}
            renderEmptySlot={
                readOnly
                    ? undefined
                    : (pos) => (
                          <div
                              role="button"
                              onClick={(e) => handleSlotClick(pos, e)}
                              style={{ width: '100%', height: '100%' }}
                          />
                      )
            }
        />
    );
}
