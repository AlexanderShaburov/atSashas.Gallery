import { CtaBlock } from '@/entities/block';

type Props = {
    item: CtaBlock;
    onClick: (item: CtaBlock) => void;
};

export function CtaBlockComponent({ item, onClick }: Props) {
    return (
        <div role="button" className="cta-block-placeholder" onClick={() => onClick(item)}>
            Cta Block Component {item.blockKind}
        </div>
    );
}
