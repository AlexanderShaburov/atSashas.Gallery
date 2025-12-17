// src/features/admin/blocks/ui/BlockPreview/GalleryComponent.tsx

import { BlockParent, GalleryBlock, GalleryLayout, ItemPosition } from '@/entities/block';
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
    parent: BlockParent; // 'grid' | 'editor'
};

function posClass(pos: ItemPosition) {
    return pos.toLowerCase();
}

function isTriptychHorizontal(layout: GalleryLayout) {
    return layout === 'triptychHorizontal';
}

export function GalleryComponent({ item, onHit, parent }: Props) {
    const isEditor = parent === 'editor';
    const imgPositions = ITEM_POSITIONS[item.layout];
    const resolveArt = useResolveArt();

    const tpl = TEMPLATE_BLOCKS.find((t) => t.kind === item.blockKind && t.layout === item.layout);
    const label = tpl?.label;

    return (
        <figure className={`blk-${item.blockKind} ${isEditor ? 'blk--editor' : ''}`}>
            {imgPositions.map((pos) => {
                const blockItem = item.items.find((i) => i.position === pos);
                const imgId = blockItem?.artId;

                const slotBaseClass = `blk-gallery__slot blk-gallery__slot-${posClass(pos)}${
                    isTriptychHorizontal(item.layout) ? '-horizontal' : ''
                }`;

                // --- EMPTY SLOT (no artId) ---
                if (!imgId) {
                    return (
                        <div key={pos} className={`${slotBaseClass} blk-gallery__slot-empty`}>
                            <div
                                role="button"
                                className="blk-gallery__slot-media"
                                onClick={(e) =>
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryImage(pos),
                                        nativeEvent: e,
                                    })
                                }
                            />

                            {/* Item caption field: always visible in editor, optional in grid */}
                            {(isEditor || !!blockItem?.caption?.en) && (
                                <div
                                    role="button"
                                    className={[
                                        'blk-field',
                                        'blk-field--slot-caption',
                                        blockItem?.caption?.en ? '' : 'is-empty',
                                    ].join(' ')}
                                    onClick={(e) =>
                                        onHit({
                                            block: item,
                                            hit: Hit.galleryCaption(pos),
                                            nativeEvent: e,
                                        })
                                    }
                                >
                                    {blockItem?.caption?.en ?? 'Item caption'}
                                </div>
                            )}
                        </div>
                    );
                }

                // --- HAVE artId: resolve art ---
                const img = resolveArt(imgId);

                // --- MISSING ART (not found in catalog) ---
                if (!img) {
                    return (
                        <div
                            key={`${imgId}-${pos}`}
                            className={`${slotBaseClass} blk-gallery__slot-missing`}
                        >
                            <div
                                role="button"
                                className="blk-gallery__slot-media"
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

                            {(isEditor || !!blockItem?.caption?.en) && (
                                <div
                                    role="button"
                                    className={[
                                        'blk-field',
                                        'blk-field--slot-caption',
                                        blockItem?.caption?.en ? '' : 'is-empty',
                                    ].join(' ')}
                                    onClick={(e) =>
                                        onHit({
                                            block: item,
                                            hit: Hit.galleryCaption(pos),
                                            nativeEvent: e,
                                        })
                                    }
                                >
                                    {blockItem?.caption?.en ?? 'Item caption'}
                                </div>
                            )}
                        </div>
                    );
                }

                // --- NORMAL ART ---
                return (
                    <div key={`${imgId}-${pos}`} className={slotBaseClass}>
                        <picture
                            role="button"
                            className="blk-gallery__slot-media"
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

                        {(isEditor || !!blockItem?.caption?.en) && (
                            <div
                                role="button"
                                className={[
                                    'blk-field',
                                    'blk-field--slot-caption',
                                    blockItem?.caption?.en ? '' : 'is-empty',
                                ].join(' ')}
                                onClick={(e) =>
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryCaption(pos),
                                        nativeEvent: e,
                                    })
                                }
                            >
                                {blockItem?.caption?.en ?? 'Item caption'}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Block caption (whole block) */}
            <figcaption
                role="button"
                className={[
                    'blk-field',
                    'blk-field--block-caption',
                    item.isTemplate ? '' : item.caption?.en ? '' : 'is-empty',
                ].join(' ')}
                onClick={(e) =>
                    onHit({
                        block: item,
                        hit: Hit.galleryBlockCaption(),
                        nativeEvent: e,
                    })
                }
            >
                {item.isTemplate
                    ? (label ?? tpl?.kind ?? 'Gallery template')
                    : (item.caption?.en ?? 'Block caption')}
            </figcaption>
        </figure>
    );
}
