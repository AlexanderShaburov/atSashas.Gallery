import type { Block, ImageBlock, TextBlock } from '@/entities/block';
import ImageComponent from '@/features/public/ui/Image/ImageComponent';
import TextComponent from '@/features/public/ui/Text/TextComponent';
import './gallery.css';

type GalleryBlockProps = { block: Block };

export default function GalleryBlock({ block }: GalleryBlockProps) {
    if (block.blockKind === 'gallery') {
        const imageBlock = block as ImageBlock;
        return <ImageComponent block={imageBlock} />;
    } else if (block.blockKind === 'text') {
        const textBlock = block as TextBlock;
        return <TextComponent block={textBlock} />;
    } else {
        return <div className="container">Unknown block type.</div>;
    }
}
