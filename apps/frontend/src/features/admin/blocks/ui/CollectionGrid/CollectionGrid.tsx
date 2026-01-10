// src/features/admin/blocks/ui/CollectionGrid/CollectionGrid.tsx

import { Block, BlocksCollectionJSON } from '@/entities/block';
import { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { createGalleryTemplateBlock } from '@/features/admin/blocks/ui/BlockTemplates';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';

import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { todayISO } from '@/shared/lib/dateAndLabels/Today';
import { Dispatch, SetStateAction } from 'react';
import './blocks.grid.css';

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
                if (b)
                    return (
                        <BlockRenderer
                            key={b.id}
                            block={b}
                            onHit={onHit}
                            parent="grid"
                            setValue={setValue}
                        />
                    );
            })}
        </div>
    );
}
