// src/features/admin/shared/ui/BlockPreview/GalleryComponent.tsx

import type { BlockHitEvent, BlockParent, GalleryBlock, ItemPosition } from '@/entities/block';
import { Hit } from '@/entities/block';
import { useResolveArtAdaptive } from '@/shared/ArtCatalogProvider/useResolveArtAdaptive';
import { GalleryBlockView } from '@/shared/ui/GalleryBlockView';

import { SlotCaptionEditor } from './SlotCaptionEditor';

type Props = {
    item: GalleryBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    readOnly?: boolean;
};

export function GalleryComponent({ item, onHit, parent, readOnly }: Props) {
    const resolveArt = useResolveArtAdaptive();
    const inEditor = !readOnly && parent === 'editor';

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
            renderArtContent={
                // In editor mode, render the slot's caption editor below the
                // picture so the author can write or edit the caption text
                // inline. In other parents (homepage preview, public block
                // view) we keep the default picture-only rendering.
                inEditor
                    ? (_art, pos, picture) => (
                          <>
                              {picture}
                              <SlotCaptionEditor block={item} position={pos} />
                          </>
                      )
                    : undefined
            }
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
