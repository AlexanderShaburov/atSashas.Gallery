//src/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx
import { Block, CtaBlock, GalleryBlock, TextBlock } from '@/entities/block';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import {
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

    const tbContent: ToolKey[] = isJourney
        ? ['delete', 'tags', 'exit', 'apply', 'save']
        : ['delete', 'tags', 'exit', 'save'];

    switch (item.blockKind) {
        case 'gallery':
            content = (
                <GalleryComponent
                    item={item as GalleryBlock}
                    onHit={onHit}
                    parent="editor"
                    setValue={setValue}
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
        default:
            content = undefined;
    }
    return (
        <div className="sbe-main">
            <div className="sbe-frame">
                <div className="sbe-canvas">{content}</div>
            </div>
            <SingleEditorToolbar tools={tbContent} ctx={tbCtx} />
        </div>
    );
}
