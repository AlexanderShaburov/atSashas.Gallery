import type { Block, ImageBlock, TextBlock } from '@/entities/block';
import './gallery.css';
import ImageComponent from './ImageComponent';
import TextComponent from './TextComponent';

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
