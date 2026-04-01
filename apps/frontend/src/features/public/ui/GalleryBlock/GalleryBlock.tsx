import type {
    Block,
    ComposableBlock as ComposableBlockType,
    EventCtaBlock,
    GalleryBlock as GalleryBlockType,
    TextBlock,
} from '@/entities/block';
import ComposableBlockPublic from '@/features/public/ui/ComposableBlockPublic/ComposableBlockPublic';
import EventCtaView from '@/features/public/ui/EventCta/EventCtaView';
import ImageComponent from '@/features/public/ui/Image/ImageComponent';
import TextComponent from '@/features/public/ui/Text/TextComponent';

import './Gallery.css';

type GalleryBlockProps = { block: Block };

export default function GalleryBlock({ block }: GalleryBlockProps) {
    if (block.blockKind === 'gallery') {
        return <ImageComponent block={block as GalleryBlockType} />;
    } else if (block.blockKind === 'text') {
        return <TextComponent block={block as TextBlock} />;
    } else if (block.blockKind === 'eventCta') {
        return <EventCtaView block={block as EventCtaBlock} />;
    } else if (block.blockKind === 'composable') {
        return <ComposableBlockPublic block={block as ComposableBlockType} />;
    } else {
        return null;
    }
}
