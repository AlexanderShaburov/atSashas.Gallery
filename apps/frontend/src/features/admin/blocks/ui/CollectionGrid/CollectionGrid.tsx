import { Block } from '@/entities/block';
import { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview/';
import { TemplateRaw } from '../BlockEditorShell/TemplateBlockCard';

export function CollectionGrid() {
    const ctx: BlockEditorSession = useBlockEditorSession();

    function processClick(item: Block) {
        ctx.setIdentity(item);
        console.log(`[handleClick]: selected block: ${item.id} of ${item.blockKind} kind`);
    }
    if (!ctx.collection) {
        return null;
    }
    return (
        <div className="collection-grid">
            {ctx.mode === 'create' && (
                <TemplateRaw
                    onSelectKind={processClick}
            )}
            {ctx.collection.blocks.map((item) => {
                switch (item.blockKind) {
                    case 'gallery':
                        return (
                            <GalleryComponent key={item.id} item={item} onClick={processClick} />
                        );
                    case 'text':
                        return (
                            <TextBlockComponent key={item.id} item={item} onClick={processClick} />
                        );
                    case 'cta':
                        return (
                            <CtaBlockComponent key={item.id} item={item} onClick={processClick} />
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}
