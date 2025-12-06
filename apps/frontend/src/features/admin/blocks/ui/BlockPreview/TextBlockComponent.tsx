import { TextBlock } from '@/entities/block';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';

type Props = {
    item: TextBlock;
    onHit: (hit: BlockHitEvent) => void;
};

export function TextBlockComponent({ item, onHit }: Props) {
    const bodyText = item.body?.en?.trim() || 'Place your text here';
    const captionText = item.caption?.en?.trim() || 'Caption';

    return (
        <div className={`blk-text`}>
            {/* Body */}
            <div
                role="button"
                className="blk-text__body"
                onClick={(e) =>
                    onHit({
                        block: item,
                        hit: Hit.textBody(),
                        nativeEvent: e,
                    })
                }
            >
                <p>{bodyText}</p>
            </div>

            {/* Caption */}
            <div
                role="button"
                className="blk-text__caption"
                onClick={(e) =>
                    onHit({
                        block: item,
                        hit: Hit.textTitle(),
                        nativeEvent: e,
                    })
                }
            >
                {captionText}
            </div>
        </div>
    );
}
