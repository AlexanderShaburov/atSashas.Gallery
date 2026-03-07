//src/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx
import { type Block, type BlockHitEvent, type CtaBlock, type EventCtaBlock, type GalleryBlock, type GalleryLayout, type ItemPosition, type TextBlock } from '@/entities/block';
import {
    CtaBlockComponent,
    EventCtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/shared/ui/BlockPreview';
import { ToolKey } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { JSX, useCallback } from 'react';
import './SingleBlockEditor.css';

const EVENT_TARGET_SLOT: Record<GalleryLayout, ItemPosition> = {
    single: 'Center',
    pairHorizontal: 'Right',
    pairVertical: 'Bottom',
    triptychHorizontal: 'Center',
    triptychLeft: 'Right',
    triptychRight: 'Left',
};

type Props = {
    item: Block;
    onHit: (e: BlockHitEvent) => void;
    setValue: (next: Block) => void;
    toolbarProps: {
        canSave: boolean;
        isSaving: boolean;
        isJourney: boolean;
        save: () => void;
        exit: () => void;
        onDelete: () => void;
        tags?: string[];
        onChangeTags?: (tags: string[]) => void;
        onApply: () => void;
    };
    addEventAndJourney?: (pos: ItemPosition) => void;
    updateItemCaption?: (pos: ItemPosition, caption: string) => void;
    updateBlockCaption?: (caption: string) => void;
};
export function SingleBlockEditor({ item, onHit, setValue, toolbarProps, addEventAndJourney, updateItemCaption, updateBlockCaption }: Props) {
    let content: JSX.Element | undefined = undefined;
    const { isJourney, ...tbCtx } = toolbarProps;

    if (isJourney) {
        console.log(`[SingleBlockEditor]: We are in journey now, baby`);
    } else {
        console.log(`[SingleBlockEditor]: Oups! We got lost our ticket, baby`);
    }

    const isGallery = item.blockKind === 'gallery';
    const galleryLayout = isGallery ? (item as GalleryBlock).layout : undefined;

    const onAddEvent = useCallback(() => {
        if (!addEventAndJourney || !galleryLayout) return;
        addEventAndJourney(EVENT_TARGET_SLOT[galleryLayout]);
    }, [addEventAndJourney, galleryLayout]);

    const tbContent: ToolKey[] = isJourney
        ? ['delete', ...(isGallery ? ['addEvent' as ToolKey] : []), 'tags', 'exit', 'apply', 'save']
        : ['delete', ...(isGallery ? ['addEvent' as ToolKey] : []), 'tags', 'exit', 'save'];

    switch (item.blockKind) {
        case 'gallery':
            content = (
                <GalleryComponent
                    item={item as GalleryBlock}
                    onHit={onHit}
                    parent="editor"
                    setValue={setValue}
                    onUpdateItemCaption={updateItemCaption}
                    onUpdateBlockCaption={updateBlockCaption}
                />
            );
            break;
        case 'cta':
            content = (
                <CtaBlockComponent
                    item={item as CtaBlock}
                    onHit={onHit}
                    parent="editor"
                    setValue={setValue}
                />
            );
            break;
        case 'text':
            content = (
                <TextBlockComponent
                    item={item as TextBlock}
                    onHit={onHit}
                    parent="editor"
                    setValue={setValue}
                />
            );
            break;
        case 'eventCta':
            content = (
                <EventCtaBlockComponent
                    item={item as EventCtaBlock}
                    onHit={onHit}
                    parent="editor"
                    setValue={setValue}
                />
            );
            break;
        default:
            content = undefined;
    }
    return (
        <div className="sbe-main">
            <div className="sbe-frame">
                <div className="sbe-canvas">{content}</div>
            </div>
            <SingleEditorToolbar
                tools={tbContent}
                ctx={{ ...tbCtx, ...(isGallery && addEventAndJourney ? { onAddEvent } : {}) }}
            />
        </div>
    );
}
