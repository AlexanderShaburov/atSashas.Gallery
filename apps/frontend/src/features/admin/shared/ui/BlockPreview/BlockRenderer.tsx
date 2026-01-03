// src/features/admin/shared/ui/BlockPreview/BlockRenderer.tsx

import { Block, BlockParent } from '@/entities/block';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { resolveSetter } from '@/shared/lib/resolvers/resolvers';
import { Dispatch, SetStateAction } from 'react';
import { CtaBlockComponent } from './CtaBlockComponent';
import { GalleryComponent } from './GalleryComponent';
import { TextBlockComponent } from './TextBlockComponent';

export type BlockProps = {
    key: string;
    block: Block;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    setValue?: Dispatch<SetStateAction<Block | undefined>>;
};

export function BlockRenderer({ block, onHit, parent, setValue }: BlockProps) {
    switch (block.blockKind) {
        case 'gallery':
            return (
                <GalleryComponent
                    key={block.id}
                    item={block}
                    onHit={onHit}
                    parent={parent}
                    setValue={resolveSetter(setValue)}
                />
            );
        case 'text':
            return (
                <TextBlockComponent
                    key={block.id}
                    item={block}
                    onHit={onHit}
                    parent={parent}
                    setValue={resolveSetter(setValue)}
                />
            );
        case 'cta':
            return (
                <CtaBlockComponent
                    key={block.id}
                    item={block}
                    onHit={onHit}
                    parent={parent}
                    setValue={resolveSetter(setValue)}
                />
            );
        default:
            return null;
    }
}
