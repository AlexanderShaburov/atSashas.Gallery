import type { Block, ImageBlock, TextBlock } from '@/entities/block';
import ImageComponent from '@/features/gallery/ui/Image/ImageComponent';
import TextComponent from '@/features/gallery/ui/Text/TextComponent';
import './gallery.css';

type GalleryBlockProps = { block: Block };

export default function GalleryBlock({ block }: GalleryBlockProps) {
    if (block.type === 'image') {
        const imageBlock = block as ImageBlock;
        return <ImageComponent block={imageBlock} />;
    } else if (block.type === 'text') {
        const textBlock = block as TextBlock;
        return <TextComponent block={textBlock} />;
    } else {
        return <div className="container">Unknown block type.</div>;
    }
}
