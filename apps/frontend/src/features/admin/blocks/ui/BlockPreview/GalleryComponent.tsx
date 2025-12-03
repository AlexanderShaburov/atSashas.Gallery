//src/features/admin/blocks/ue/BlockPreview/GalleryComponent.tsx

import { GalleryBlock, GalleryLayout, ItemPosition } from '@/entities/block';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockEditorShell/editorTypes';
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
    const resolveArt = useResolveArt();
    return (
        <>
            <figure className={`gc-block-${item.blockKind}`}>
                {imgPositions.map((pos) => {
                    const blockItem = item.items.find((i) => i.position === pos);
                    const imgId = blockItem?.artId;

                    if (!imgId) {
                        // Empty slot for this position
                        return (
                            <div
                                key={pos}
                                className={`gc-slot gs-slot-empty gc-slot-${pos.toLowerCase()}`}
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
                                className={`gc-slot gc-slot-missing gc-slot-${pos.toLowerCase()}`}
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
                        <>
                            <picture
                                key={imgId ?? `${imgId}-${pos}`}
                                role="button"
                                className={`gc-slot gc-slot-${pos.toLowerCase()}`}
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
                                    className="gc-slot-caption"
                                    role="button"
                                    onClick={(e) =>
                                        onHit({
                                            block: item,
                                            hit: Hit.galleryCaption(pos),
                                            nativeEvent: e,
                                        })
                                    }
                                ></div>
                            )}
                        </>
                    );
                })}
            </figure>
            <caption
                key={item.id ?? `${item.id}-block-caption`}
                role="button"
                className={`gc-block gc-block-caption`}
                onClick={(e) =>
                    onHit({ block: item, hit: Hit.galleryBlockCaption(), nativeEvent: e })
                }
            >
                {item.caption?.en ? item.caption.en : ''}
            </caption>
        </>
    );
}
