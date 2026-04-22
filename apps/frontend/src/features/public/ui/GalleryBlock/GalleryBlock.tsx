import type {
    Block,
    ComposableBlock as ComposableBlockType,
    GalleryBlock as GalleryBlockType,
    TextBlock,
} from '@/entities/block';
import ComposableBlockPublic from '@/features/public/ui/ComposableBlockPublic/ComposableBlockPublic';
import ImageComponent from '@/features/public/ui/Image/ImageComponent';
import TextComponent from '@/features/public/ui/Text/TextComponent';

import './Gallery.css';

type GalleryBlockProps = { block: Block };

export default function GalleryBlock({ block }: GalleryBlockProps) {
    if (block.blockKind === 'gallery') {
        return <ImageComponent block={block as GalleryBlockType} />;
    } else if (block.blockKind === 'text') {
        return <TextComponent block={block as TextBlock} />;
    } else if (block.blockKind === 'composable') {
        return <ComposableBlockPublic block={block as ComposableBlockType} />;
    } else {
        return null;
    }
}
