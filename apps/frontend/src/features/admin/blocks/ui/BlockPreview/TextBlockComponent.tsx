import { TextBlock } from '@/entities/block';

type Props = {
    item: TextBlock;
    onClick: (item: TextBlock) => void;
};

export function TextBlockComponent({ item, onClick }: Props) {
    return (
        <div role="button" className="cta-block-placeholder" onClick={() => onClick(item)}>
            Text Block Component
            <p>{item.body?.en}</p>
        </div>
    );
}
