// src/features/admin/blocks/ui/CollectionGrid/CollectionGrid.tsx

import { type Block, type BlockHitEvent, type BlocksCollectionJSON, Hit } from '@/entities/block';
import { createGalleryTemplateBlock } from '@/features/admin/blocks/ui/BlockTemplates';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';

import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { BlockThumbnail } from '@/shared/ui/BlockThumbnail';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { Frame } from '@/shared/ui/Frame';
import type { ThreeDotAction, ThreeDotCommand, ThreeDotOwner } from '@/shared/ui/ThreeDotMenu/threeDot.types';
import { ThreeDotMenuOverlay, type ThreeDotMenuItem } from '@/shared/ui/ThreeDotMenu/ThreeDotMenuOverlay';
import { useThreeDotController } from '@/shared/ui/ThreeDotMenu/useThreeDotController';
import { useCallback, useMemo } from 'react';
import './blocks.grid.css';

type Props = {
    collection: BlocksCollectionJSON | undefined;
    onHit: (hit: BlockHitEvent) => void;
    setValue: (next: Block) => void;
    onDeleteBlock?: (blockId: string) => void;
    onDuplicateBlock?: (blockId: string) => void;
};

const MENU_ITEMS: ThreeDotMenuItem[] = [
    { key: 'edit', label: 'Edit', action: { kind: 'editBlock' } },
    { key: 'duplicate', label: 'Duplicate', action: { kind: 'duplicateBlock' } },
    { key: 'delete', label: 'Delete', action: { kind: 'deleteBlock' }, danger: true },
];

export function CollectionGrid({ collection, onHit, setValue, onDeleteBlock, onDuplicateBlock }: Props) {
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

    const handleCommand = useCallback(
        (cmd: ThreeDotCommand) => {
            if (cmd.owner.kind !== 'blockCollection') return;
            const blockId = cmd.owner.blockId;
            const block = safeCollection.blocks[blockId];

            switch (cmd.action.kind) {
                case 'editBlock': {
                    if (!block) break;
                    const syntheticEvent = new MouseEvent('click') as unknown as React.MouseEvent<HTMLElement>;
                    onHit({ block, hit: Hit.galleryImage('Center'), nativeEvent: syntheticEvent });
                    break;
                }
                case 'duplicateBlock': {
                    onDuplicateBlock?.(blockId);
                    break;
                }
                case 'deleteBlock': {
                    onDeleteBlock?.(blockId);
                    break;
                }
            }
        },
        [safeCollection.blocks, onHit, onDeleteBlock, onDuplicateBlock],
    );

    const buildOwner = useCallback(
        (params: { blockId: string }): ThreeDotOwner => ({
            kind: 'blockCollection',
            blockId: params.blockId,
        }),
        [],
    );

    const opts = useMemo(
        () => ({ buildOwner, onCommand: handleCommand }),
        [buildOwner, handleCommand],
    );

    const tdm = useThreeDotController<{ blockId: string }>(opts);

    const handleThreeDotSelect = useCallback(
        (action: ThreeDotAction) => {
            tdm.select(action);
        },
        [tdm],
    );

    return (
        <div className="grid-collection">
            <TemplateRaw onSelectKind={onHit} setValue={setValue} />
            {safeCollection.order.map((item) => {
                const b = safeCollection.blocks[item];
                if (!b) return null;

                const handleCardClick = (e: React.MouseEvent) => {
                    onHit({
                        block: b,
                        hit: Hit.galleryImage('Center'),
                        nativeEvent: e as React.MouseEvent<HTMLElement>,
                    });
                };

                return (
                    <Frame
                        key={b.id}
                        mode="card"
                        aspectRatio="4/3"
                        className="grid-collection__card"
                        onClick={handleCardClick}
                    >
                        {b.blockKind === 'gallery' ? (
                            <BlockThumbnail block={b} />
                        ) : (
                            <BlockRenderer
                                key={b.id}
                                block={b}
                                onHit={onHit}
                                parent="grid"
                                setValue={setValue}
                                readOnly
                            />
                        )}
                        <button
                            className="grid-collection__dots"
                            onClick={(e) => {
                                e.stopPropagation();
                                tdm.toggleFromEvent({ blockId: b.id, el: e.currentTarget });
                            }}
                            aria-label="Block actions"
                        >
                            &#8942;
                        </button>
                    </Frame>
                );
            })}

            <ThreeDotMenuOverlay
                isOpen={tdm.state.isOpen}
                owner={tdm.state.owner}
                anchorRect={tdm.state.anchor?.rect ?? null}
                items={MENU_ITEMS}
                onSelect={handleThreeDotSelect}
                onClose={tdm.close}
            />
        </div>
    );
}
