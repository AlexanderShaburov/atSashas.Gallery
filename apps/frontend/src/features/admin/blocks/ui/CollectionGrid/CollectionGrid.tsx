import { Block, BlocksCollectionJSON } from '@/entities/block';
import { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview/';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { todayISO } from '@/shared/lib/date/Today';
import { createGalleryTemplateBlock } from '../BlockTemplates';
import './blocks.grid.css';
import { Dispatch, SetStateAction } from 'react';

type Props = {
    collection: BlocksCollectionJSON | undefined;
    onHit: (hit: BlockHitEvent) => void;
    setValue: Dispatch<SetStateAction<Block | undefined>>;
};

export function CollectionGrid({ collection, onHit, setValue }: Props) {
    const ctx: BlockEditorSession = useBlockEditorSession();

    let safeCollection: BlocksCollectionJSON;
    if (!collection) {
        safeCollection = {
            kind: 'BlockCollection',
            collectionId: '',
            collectionName: 'empty',
            version: 0,
            updatedAt: todayISO(),
            generatedAt: todayISO(),
            blocks: { template: createGalleryTemplateBlock('single') },
            order: [],
        };
    } else {
        safeCollection = collection;
    }

    return (
        <div className="grid-collection">
            {ctx.mode === 'create' && <TemplateRaw onSelectKind={onHit} setValue={setValue} />}
            {safeCollection.order.map((item) => {
                const b = safeCollection.blocks[item];
                switch (b?.blockKind) {
                    case 'gallery':
                        return (
                            <GalleryComponent
                                key={b.id}
                                item={b}
                                onHit={onHit}
                                parent="grid"
                                setValue={setValue}
                            />
                        );
                    case 'text':
                        return (
                            <TextBlockComponent
                                key={b.id}
                                item={b}
                                onHit={onHit}
                                parent="grid"
                                setValue={setValue}
                            />
                        );
                    case 'cta':
                        return (
                            <CtaBlockComponent
                                key={b.id}
                                item={b}
                                onHit={onHit}
                                parent="grid"
                                setValue={setValue}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}
