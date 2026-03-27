import type { CtaBlock } from '@/entities/block';
import './CtaView.css';

type Props = { block: CtaBlock };

export default function CtaView({ block }: Props) {
    const href =
        block.target?.type === 'external'
            ? block.target.url
            : block.target?.type === 'stream'
              ? `/gallery/${block.target.slug}`
              : undefined;

    return (
        <div className="block cta">
            {block.title?.en && <h3 className="cta__title">{block.title.en}</h3>}
            {block.body?.en && <p className="cta__body">{block.body.en}</p>}
            {block.buttonLabel?.en && href && (
                <a
                    className="cta__button"
                    href={href}
                    target={block.target?.type === 'external' ? '_blank' : undefined}
                    rel={block.target?.type === 'external' ? 'noopener noreferrer' : undefined}
                >
                    {block.buttonLabel.en}
                </a>
            )}
        </div>
    );
}
