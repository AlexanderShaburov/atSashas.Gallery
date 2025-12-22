// src/features/admin/blocks/ui/BlockPreview/GalleryComponent.tsx

import {
    Block,
    BlockParent,
    EditTarget,
    GalleryBlock,
    GalleryBlockItem,
    GalleryLayout,
    ItemPosition,
} from '@/entities/block';
import { InlineEditableText } from '@/features/admin/blocks/ui/BlockPreview';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { TEMPLATE_BLOCKS } from '@/features/admin/blocks/ui/BlockTemplates/templateTypes';
import { useResolveArt } from '@/shared/ArtCatalogProvider.tsx/CatalogHook';
import { Dispatch, SetStateAction } from 'react';
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
    setValue: Dispatch<SetStateAction<Block | undefined>>; // to set new value session.setValue()
};

function posClass(pos: ItemPosition) {
    return pos.toLowerCase();
}

function isTriptychHorizontal(layout: GalleryLayout) {
    return layout === 'triptychHorizontal';
}

export function GalleryComponent({ item, onHit, parent, setValue }: Props) {
    const isEditor = parent === 'editor';
    const imgPositions = ITEM_POSITIONS[item.layout];
    const resolveArt = useResolveArt();

    const tpl = TEMPLATE_BLOCKS.find((t) => t.kind === item.blockKind && t.layout === item.layout);
    const label = tpl?.label;
    console.log(`[GalleryComponent]: Render`);
    const renderItemCaption = (pos: ItemPosition, blockItem?: GalleryBlockItem) => {
        if (isEditor && !!blockItem) return null;

        const target: EditTarget = {
            blockKind: 'gallery',
            slot: pos,
            kind: 'imageCaption',
        };
        console.log('[GalleryComponent]: target calculated as:');
        console.dir(target);

        const current = blockItem?.caption?.en ?? '';

        return (
            <InlineEditableText
                block={item}
                target={target}
                currentTextValue={current}
                className={['blk-field', 'blk-field--slot-caption', current ? '' : 'is-empty']
                    .filter(Boolean)
                    .join(' ')}
                hit={Hit.galleryCaption(pos)}
                onCommit={(draft) => {
                    const next = draft ?? '';
                    const newItem = {
                        ...item,
                        items: item.items.map((i) =>
                            i.position === pos
                                ? { ...i, caption: { ...(i.caption ?? {}), en: next } }
                                : i,
                        ),
                    };
                    setValue(newItem);
                }}
            >
                {(p) => <div {...p}>{current || 'Item caption'}</div>}
            </InlineEditableText>
        );
    };
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

                            {(isEditor || !!blockItem?.caption?.en) &&
                                renderItemCaption(pos, blockItem)}
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

                        {(isEditor || !!blockItem?.caption?.en) &&
                            renderItemCaption(pos, blockItem)}
                    </div>
                );
            })}

            {/* Block caption (whole block) */}
            <InlineEditableText
                block={item}
                target={{
                    blockKind: 'gallery',
                    slot: undefined,
                    kind: 'blockCaption',
                }}
                currentTextValue={item.caption?.en ?? ''}
                className={[
                    'blk-field',
                    'blk-field--block-caption',
                    item.isTemplate ? '' : item.caption?.en ? '' : 'is-empty',
                ].join(' ')}
                hit={Hit.galleryBlockCaption()}
                onCommit={(draft) => {
                    const next = draft ?? '';
                    const newItem = {
                        ...item,
                        caption: { ...(item.caption ?? {}), en: next },
                    } as GalleryBlock;

                    setValue(newItem);
                }}
            >
                {(p) => (
                    <figcaption {...p}>
                        {item.isTemplate
                            ? (label ?? tpl?.kind ?? 'Gallery template')
                            : (item.caption?.en ?? 'Block caption')}
                    </figcaption>
                )}
            </InlineEditableText>
        </figure>
    );
}
