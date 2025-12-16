//src/features/admin/blocks/ue/BlockPreview/GalleryComponent.tsx

import { GalleryBlock, GalleryLayout, ItemPosition } from '@/entities/block';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { TEMPLATE_BLOCKS } from '@/features/admin/blocks/ui/BlockTemplates/templateTypes';
import { useResolveArt } from '@/shared/ArtCatalogProvider.tsx/CatalogHook';
const ITEM_POSITIONS: Record<GalleryLayout, ItemPosition[]> = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychLeft: ['LS', 'RUC', 'RBC'],
    triptychRight: ['LUC', 'LBC', 'RS'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
};
type Props = {
    item: GalleryBlock;

    onHit: (hit: BlockHitEvent) => void;
};

export function GalleryComponent({ item, onHit }: Props) {
    const imgPositions = ITEM_POSITIONS[item.layout];
    // Getting ArtItemData by its artItemId resolver instance:
    const resolveArt = useResolveArt();
    const tpl = TEMPLATE_BLOCKS.find(
        (tpl) => tpl.kind === item.blockKind && tpl.layout === item.layout,
    );
    const label = tpl?.label;

    return (
        <>
            <figure className={`blk-${item.blockKind}`}>
                {imgPositions.map((pos) => {
                    const blockItem = item.items.find((i) => i.position === pos);
                    const imgId = blockItem?.artId;

                    if (!imgId) {
                        // Empty slot for this position
                        return (
                            <div
                                key={pos}
                                className={`blk-gallery__slot blk-gallery__slot-empty blk-gallery__slot-${pos.toLowerCase()}${
                                    item.layout === 'triptychHorizontal' ? '-horizontal' : ''
                                }`}
                                role="button"
                                onClick={(e) =>
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryImage(pos),
                                        nativeEvent: e,
                                    })
                                }
                            />
                        );
                    }
                    const img = resolveArt(imgId);
                    if (!img) {
                        // Art not found in catalog
                        return (
                            <div
                                key={`${imgId}-${pos}`}
                                className={`blk-gallery__slot blk-gallery__slot-missing blk-gallery__slot-${pos.toLowerCase()}${
                                    item.layout === 'triptychHorizontal' ? '-horizontal' : ''
                                }`}
                                role="button"
                                onClick={(e) =>
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryImage(pos),
                                        nativeEvent: e,
                                    })
                                }
                            >
                                Missing art: {imgId}
                            </div>
                        );
                    }
                    return (
                        <div
                            key={imgId ?? `${imgId}-${pos}`}
                            className={`blk-gallery__slot blk-gallery__slot-${pos.toLowerCase()}${
                                item.layout === 'triptychHorizontal' ? '-horizontal' : ''
                            }`}
                        >
                            <picture
                                role="button"
                                onClick={(e) =>
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryImage(pos),
                                        nativeEvent: e,
                                    })
                                }
                            >
                                <source type="image/avif" srcSet={img.images.preview.avif} />
                                <source type="image/webp" srcSet={img.images.preview.webp} />
                                <img
                                    src={img.images.preview.jpeg}
                                    alt={img.images.alt.en || ''}
                                    loading="lazy"
                                />
                            </picture>
                            {blockItem?.caption && (
                                <div
                                    className="blk-gallery__slot-caption"
                                    role="button"
                                    onClick={(e) =>
                                        onHit({
                                            block: item,
                                            hit: Hit.galleryCaption(pos),
                                            nativeEvent: e,
                                        })
                                    }
                                >
                                    {blockItem.caption.en}
                                </div>
                            )}
                        </div>
                    );
                })}
                <figcaption
                    role="button"
                    className={`blk-gallery blk-gallery_caption`}
                    onClick={(e) =>
                        onHit({
                            block: item,
                            hit: Hit.galleryBlockCaption(),
                            nativeEvent: e,
                        })
                    }
                >
                    {item.isTemplate ? (label ?? tpl?.kind) : (item.caption?.en ?? '')}
                </figcaption>
            </figure>
        </>
    );
}
