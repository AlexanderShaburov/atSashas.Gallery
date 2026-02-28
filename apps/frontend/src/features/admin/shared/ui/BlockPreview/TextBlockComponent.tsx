import { type Block, type BlockHitEvent, type BlockParent, Hit, type TextBlock } from '@/entities/block';

type Props = {
    item: TextBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent; // 'grid' | 'editor'
    setValue: (next: Block) => void; // to set new value session.setValue()
    readOnly?: boolean;
};

export function TextBlockComponent({ item, onHit, parent }: Props) {
    const isEditor = parent === 'editor';

    const titleText = item.title?.en?.trim() ?? '';
    const bodyText = item.body?.en?.trim() ?? '';

    // In editor we always render fields (with placeholders),
    // in grid we render only when there is content.
    const showTitle = isEditor || !!titleText;
    const showBody = isEditor || !!bodyText;

    return (
        <div className={`blk-text ${isEditor ? 'blk--editor' : ''}`}>
            {/* Title (top) */}
            {showTitle && (
                <div
                    role="button"
                    className={[
                        isEditor ? 'blk-field blk-field--text-title' : 'blk-text__title',
                        !titleText ? 'is-empty' : '',
                    ].join(' ')}
                    onClick={(e) =>
                        onHit({
                            block: item,
                            hit: Hit.textTitle(),
                            nativeEvent: e,
                        })
                    }
                >
                    {titleText || 'Title'}
                </div>
            )}

            {/* Body (below) */}
            {showBody && (
                <div
                    role="button"
                    className={[
                        isEditor ? 'blk-field blk-field--text-body' : 'blk-text__body',
                        !bodyText ? 'is-empty' : '',
                    ].join(' ')}
                    onClick={(e) =>
                        onHit({
                            block: item,
                            hit: Hit.textBody(),
                            nativeEvent: e,
                        })
                    }
                >
                    {bodyText ? <p>{bodyText}</p> : <p>Place your text here</p>}
                </div>
            )}
        </div>
    );
}
