import { TextBlock } from '@/entities/block';
type TextBlockProps = { block: TextBlock };
export default function TextComponent({ block }: TextBlockProps) {
    const { title, body, variant } = block;

    return (
        <div className={`block note ${variant ?? 'full'}`}>
            {title?.en && <h3>{title.en}</h3>}
            {body?.en && <p>{body.en}</p>}
        </div>
    );
}
