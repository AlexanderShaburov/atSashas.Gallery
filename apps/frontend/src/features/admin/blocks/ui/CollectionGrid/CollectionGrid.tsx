import { BlocksCollectionJSON } from '@/entities/block';
import { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview/';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import './blocks.grid.css';

type Props = {
    collection: BlocksCollectionJSON;
    onHit: (hit: BlockHitEvent) => void;
};

export function CollectionGrid({ collection, onHit }: Props) {
    const ctx: BlockEditorSession = useBlockEditorSession();

    // function processClick(item: Block) {
    //     ctx.setIdentity(item);
    //     console.log(`[handleClick]: selected block: ${item.id} of ${item.blockKind} kind`);
    // }
    if (!ctx.collection) {
        return null;
    }
    return (
        <div className="grid-collection">
            {ctx.mode === 'create' && <TemplateRaw onSelectKind={onHit} />}
            {collection.blocks.map((item) => {
                switch (item.blockKind) {
                    case 'gallery':
                        return <GalleryComponent key={item.id} item={item} onHit={onHit} />;
                    case 'text':
                        return <TextBlockComponent key={item.id} item={item} onHit={onHit} />;
                    case 'cta':
                        return <CtaBlockComponent key={item.id} item={item} onHit={onHit} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}
