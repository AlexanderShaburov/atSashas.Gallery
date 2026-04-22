//src/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx
import { type Block, type BlockHitEvent, type ComposableBlock, type CtaBlock, type GalleryBlock, type TextBlock } from '@/entities/block';
import {
    ComposableBlockComponent,
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/shared/ui/BlockPreview';
import { ToolKey } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { JSX } from 'react';
import './SingleBlockEditor.css';

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
        onCustomize?: () => void;
    };
};
export function SingleBlockEditor({ item, onHit, setValue, toolbarProps }: Props) {
    let content: JSX.Element | undefined = undefined;
    const { isJourney, ...tbCtx } = toolbarProps;

    if (isJourney) {
        console.log(`[SingleBlockEditor]: We are in journey now, baby`);
    } else {
        console.log(`[SingleBlockEditor]: Oups! We got lost our ticket, baby`);
    }

    const isGallery = item.blockKind === 'gallery';
    const showCustomize = isGallery && !isJourney;
    // Legacy "Add Event" toolbar entry has been retired. Block-level event
    // attachment for the homepage is no longer supported; events are composed
    // at the homepage level via Homepage Editor.
    const tbContent: ToolKey[] = isJourney
        ? ['delete', 'tags', 'exit', 'apply', 'save']
        : [
              'delete',
              ...(showCustomize ? ['customize' as ToolKey] : []),
              'tags',
              'exit',
              'save',
          ];

    switch (item.blockKind) {
        case 'gallery':
            content = (
                <GalleryComponent
                    item={item as GalleryBlock}
                    onHit={onHit}
                    parent="editor"
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
        case 'composable':
            content = (
                <ComposableBlockComponent
                    item={item as ComposableBlock}
                    onHit={onHit}
                    parent="editor"
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
                ctx={tbCtx}
            />
        </div>
    );
}
