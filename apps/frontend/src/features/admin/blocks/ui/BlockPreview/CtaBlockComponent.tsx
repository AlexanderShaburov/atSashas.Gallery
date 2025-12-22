import { Block, BlockParent, CtaBlock } from '@/entities/block';
import '@/features/admin/blocks/ui/BlockTemplates/block.templates.css';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { Dispatch, SetStateAction } from 'react';
type Props = {
    item: CtaBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    setValue: Dispatch<SetStateAction<Block | undefined>>;
};

export function CtaBlockComponent({ item, onHit }: Props) {
    return (
        <div
            role="button"
            className={`blk-cta-${item.target?.type} blk-cta`}
            onClick={(e) =>
                onHit({
                    block: item,
                    hit: Hit.ctaButton(),
                    nativeEvent: e,
                })
            }
        >
            <div>{item.target?.type}</div>
        </div>
    );
}
