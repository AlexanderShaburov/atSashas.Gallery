// src/features/admin/blocks/ui/CollectionGrid/CollectionGrid.tsx

import { type Block, type BlockHitEvent, type BlocksCollectionJSON } from '@/entities/block';
import { createGalleryTemplateBlock } from '@/features/admin/blocks/ui/BlockTemplates';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';

import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import './blocks.grid.css';

type Props = {
    collection: BlocksCollectionJSON | undefined;
    onHit: (hit: BlockHitEvent) => void;
    setValue: (next: Block) => void;
};

export function CollectionGrid({ collection, onHit, setValue }: Props) {
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
            <TemplateRaw onSelectKind={onHit} setValue={setValue} />
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
