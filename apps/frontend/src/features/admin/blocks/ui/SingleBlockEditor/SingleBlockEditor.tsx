//src/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx
import { CtaBlock, GalleryBlock, TextBlock } from '@/entities/block';
import { BlockFormValue } from '@/features/admin/blocks/editorSession';
import { formToBlock } from '@/features/admin/blocks/editorSession/';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { JSX } from 'react';
import './SingleBlockEditor.css';

type Props = {
    item: BlockFormValue;
    onHit: (e: BlockHitEvent) => void;
    toolbarProps: {
        canSave: boolean;
        saving: boolean;
        save: () => void;
        exit: () => void;
        onDelete: () => void;
    };
};
export function SingleBlockEditor({ item, onHit, toolbarProps }: Props) {
    let content: JSX.Element | undefined = undefined;
    switch (item.blockKind) {
        case 'gallery':
            content = <GalleryComponent item={formToBlock(item) as GalleryBlock} onHit={onHit} />;
            break;
        case 'cta':
            content = <CtaBlockComponent item={formToBlock(item) as CtaBlock} onHit={onHit} />;
            break;
        case 'text':
            content = <TextBlockComponent item={formToBlock(item) as TextBlock} onHit={onHit} />;
            break;
        default:
            content = undefined;
    }
    return (
        <div className="sbe-main">
            <div className="sbe-frame">
                <div className="sbe-canvas">{content}</div>
            </div>
            <SingleEditorToolbar {...toolbarProps} />
        </div>
    );
}
