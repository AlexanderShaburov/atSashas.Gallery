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
import {
    isArtItem,
    isEventItem,
} from '@/features/admin/blocks/blockEditorSession/blockEditorSession.utils';
import {
    BlockHit,
    BlockHitEvent,
    Hit,
} from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { TEMPLATE_BLOCKS } from '@/features/admin/blocks/ui/BlockTemplates/templateTypes';
import { GalleryEventSlot } from '@/features/admin/shared/ui/BlockPreview/GalleryEventSlot';
import { InlineEditableText } from '@/features/admin/shared/ui/BlockPreview';
import { SlotChoiceMenu } from '@/features/admin/shared/ui/BlockPreview/SlotChoiceMenu';
import { useResolveArtAdaptive } from '@/shared/ArtCatalogProvider/useResolveArtAdaptive';
import { JSX, ReactNode, useState } from 'react';

const ITEM_POSITIONS: Record<GalleryLayout, ItemPosition[]> = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychLeft: ['LBC', 'LUC', 'Right'],
    triptychRight: ['Left', 'RUC', 'RBC'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
};

type Props = {
    item: GalleryBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent; // 'grid' | 'editor'
    setValue: (next: Block) => void; // to set new value session.setValue()
    readOnly?: boolean;
};

function posClass(pos: ItemPosition) {
    return pos.toLowerCase();
}

function isTriptychHorizontal(layout: GalleryLayout) {
    return layout === 'triptychHorizontal';
}

type CaptionRenderOptions = {
    value: string;
    placeholder: string;
    className: string;
    block: Block;
    target: EditTarget;
    hit: BlockHit;
    onCommit: (draft?: string) => void;
    renderWrapper?: (p: Record<string, unknown>, content: ReactNode) => JSX.Element;
};

export function GalleryComponent({ item, onHit, parent, setValue, readOnly }: Props) {
    const isEditor = parent === 'editor';
    const imgPositions = ITEM_POSITIONS[item.layout];
    const resolveArt = useResolveArtAdaptive();
    const [slotChoice, setSlotChoice] = useState<{ pos: ItemPosition; top: number; left: number } | null>(null);

    const tpl = TEMPLATE_BLOCKS.find((t) => t.kind === item.blockKind && t.layout === item.layout);
    const label = tpl?.label;

    const renderCaptionValue = (value: string, placeholder: string, className: string) => {
        // readOnly=true => показываем только реально существующие caption'ы (без плейсхолдеров)
        if (readOnly) return value ? <div className={className}>{value}</div> : null;

        // readOnly=false/undefined => как в редакторе: показываем плейсхолдер в editor, а в grid только если есть текст
        const shouldShow = isEditor || !!value;
        if (!shouldShow) return null;

        return <div className={className}>{value || placeholder}</div>;
    };

    const renderInlineOrCaption = (opts: CaptionRenderOptions) => {
        const content = renderCaptionValue(opts.value, opts.placeholder, opts.className);
        if (!content) return null;

        // readOnly=true => никогда не используем InlineEditableText
        if (readOnly) return content;

        return (
            <InlineEditableText
                block={opts.block}
                target={opts.target}
                currentTextValue={opts.value}
                className={opts.className}
                hit={opts.hit}
                onCommit={opts.onCommit}
            >
                {(p) =>
                    opts.renderWrapper ? (
                        opts.renderWrapper(p as unknown as Record<string, unknown>, content)
                    ) : (
                        <div {...(p as unknown as Record<string, unknown>)}>
                            {opts.value || opts.placeholder}
                        </div>
                    )
                }
            </InlineEditableText>
        );
    };

    const renderItemCaption = (pos: ItemPosition, blockItem?: GalleryBlockItem) => {
        const current = (blockItem && 'caption' in blockItem ? blockItem.caption?.en : undefined) ?? '';

        const className = ['blk-field', 'blk-field--slot-caption', current ? '' : 'is-empty']
            .filter(Boolean)
            .join(' ');

        const target: EditTarget = {
            blockKind: 'gallery',
            slot: pos,
            kind: 'imageCaption',
        };

        return renderInlineOrCaption({
            value: current,
            placeholder: 'Item caption',
            className,
            block: item,
            target,
            hit: Hit.galleryCaption(pos),
            onCommit: (draft) => {
                const next = draft ?? '';
                const newItem = {
                    ...item,
                    items: item.items.map((i) =>
                        i.position === pos
                            ? { ...i, caption: { ...('caption' in i ? i.caption ?? {} : {}), en: next } }
                            : i,
                    ),
                };
                setValue(newItem);
            },
        });
    };

    const renderBlockCaption = () => {
        const current = item.caption?.en ?? '';
        const className = [
            'blk-field',
            'blk-field--block-caption',
            item.isTemplate ? '' : current ? '' : 'is-empty',
        ].join(' ');

        // readOnly=true => показываем только если реально есть caption
        if (readOnly) {
            return current ? <figcaption className={className}>{current}</figcaption> : null;
        }

        return (
            <InlineEditableText
                block={item}
                target={{
                    blockKind: 'gallery',
                    slot: undefined,
                    kind: 'blockCaption',
                }}
                currentTextValue={current}
                className={className}
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
                    <figcaption {...(p as unknown as Record<string, unknown>)}>
                        {item.isTemplate
                            ? label || tpl?.kind || 'Gallery template'
                            : current || 'Block caption'}
                    </figcaption>
                )}
            </InlineEditableText>
        );
    };

    const handleEmptySlotClick = (pos: ItemPosition, e: React.MouseEvent<HTMLElement>) => {
        if (isEditor) {
            const rect = e.currentTarget.getBoundingClientRect();
            setSlotChoice({
                pos,
                top: rect.top + rect.height / 2,
                left: rect.left + rect.width / 2,
            });
        } else {
            onHit({ block: item, hit: Hit.galleryImage(pos), nativeEvent: e });
        }
    };

    const handleChooseArt = (pos: ItemPosition) => {
        setSlotChoice(null);
        // Synthesize a hit event to trigger the art journey
        const syntheticEvent = new MouseEvent('click') as unknown as React.MouseEvent<HTMLElement>;
        onHit({ block: item, hit: Hit.galleryImage(pos), nativeEvent: syntheticEvent });
    };

    const handleChooseEvent = (pos: ItemPosition) => {
        setSlotChoice(null);
        // Insert a GalleryEventItem placeholder with empty eventId
        const newEventItem: GalleryBlockItem = {
            kind: 'eventCta',
            eventId: '',
            position: pos,
        };
        setValue({ ...item, items: [...item.items, newEventItem] });
    };

    return (
        <figure className={`blk-${item.blockKind} ${isEditor ? 'blk--editor' : ''}`}>
            {imgPositions.map((pos) => {
                const blockItem = item.items.find((i) => i.position === pos);

                const slotBaseClass = `blk-gallery__slot blk-gallery__slot-${posClass(pos)}${
                    isTriptychHorizontal(item.layout) ? '-horizontal' : ''
                }`;

                // --- EMPTY SLOT (no item at this position) ---
                if (!blockItem) {
                    return (
                        <div key={pos} className={`${slotBaseClass} blk-gallery__slot-empty`}>
                            <div
                                role="button"
                                className="blk-gallery__slot-media"
                                onClick={(e) => handleEmptySlotClick(pos, e)}
                            />

                            {renderItemCaption(pos, blockItem)}
                        </div>
                    );
                }

                // --- EVENT ITEM ---
                if (isEventItem(blockItem)) {
                    return (
                        <div
                            key={`event-${pos}`}
                            className={`${slotBaseClass} blk-gallery__slot-event`}
                        >
                            <GalleryEventSlot
                                item={blockItem}
                                isEditor={isEditor}
                                resolvedBgSrc={
                                    blockItem.backgroundArtId
                                        ? resolveArt(blockItem.backgroundArtId)?.images.preview
                                              .jpeg
                                        : undefined
                                }
                                onPickEvent={() => {
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryEventPickEvent(pos),
                                        nativeEvent:
                                            new MouseEvent('click') as unknown as React.MouseEvent<HTMLElement>,
                                    });
                                }}
                                onPickBackground={() => {
                                    onHit({
                                        block: item,
                                        hit: Hit.galleryEventPickBackground(pos),
                                        nativeEvent:
                                            new MouseEvent('click') as unknown as React.MouseEvent<HTMLElement>,
                                    });
                                }}
                            />
                        </div>
                    );
                }

                // --- ART ITEM ---
                if (isArtItem(blockItem)) {
                    const imgId = blockItem.artId;

                    if (!imgId) {
                        return (
                            <div key={pos} className={`${slotBaseClass} blk-gallery__slot-empty`}>
                                <div
                                    role="button"
                                    className="blk-gallery__slot-media"
                                    onClick={(e) => handleEmptySlotClick(pos, e)}
                                />
                                {renderItemCaption(pos, blockItem)}
                            </div>
                        );
                    }

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

                                {renderItemCaption(pos, blockItem)}
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
                                    alt={img.images.alt?.en || ''}
                                    loading="lazy"
                                />
                            </picture>

                            {renderItemCaption(pos, blockItem)}
                        </div>
                    );
                }

                return null;
            })}

            {renderBlockCaption()}

            {slotChoice && (
                <SlotChoiceMenu
                    top={slotChoice.top}
                    left={slotChoice.left}
                    onChooseArt={() => handleChooseArt(slotChoice.pos)}
                    onChooseEvent={() => handleChooseEvent(slotChoice.pos)}
                    onClose={() => setSlotChoice(null)}
                />
            )}
        </figure>
    );
}
