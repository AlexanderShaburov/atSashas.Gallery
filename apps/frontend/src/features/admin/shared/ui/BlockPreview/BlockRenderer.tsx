// src/features/admin/shared/ui/BlockPreview/BlockRenderer.tsx

import { type Block, type BlockHitEvent, type BlockParent } from '@/entities/block';
import { resolveSetter } from '@/shared/lib/resolvers/resolvers';
import { ComposableBlockComponent } from './ComposableBlockComponent';
import { CtaBlockComponent } from './CtaBlockComponent';
import { GalleryComponent } from './GalleryComponent';
import { TextBlockComponent } from './TextBlockComponent';

export type BlockProps = {
    key: string;
    block: Block;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    setValue?: (next: Block) => void;
    readOnly?: boolean;
};

export function BlockRenderer({ block, onHit, parent, setValue, readOnly }: BlockProps) {
    switch (block.blockKind) {
        case 'gallery':
            return (
                <GalleryComponent
                    key={block.id}
                    item={block}
                    onHit={onHit}
                    parent={parent}
                    readOnly={readOnly}
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
                    readOnly={readOnly}
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
                    readOnly={readOnly}
                />
            );
        case 'composable':
            return (
                <ComposableBlockComponent
                    key={block.id}
                    item={block}
                    onHit={onHit}
                    parent={parent}
                />
            );
        default:
            return null;
    }
}
