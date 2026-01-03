import { CtaBlock, GalleryBlock, TextBlock } from '@/entities/block';

export type BlockComponentMap = {
    gallery: React.FC<{ item: GalleryBlock; onClick: (item: GalleryBlock) => void }>;
    text: React.FC<{ item: TextBlock; onClick: (item: TextBlock) => void }>;
    cta: React.FC<{ item: CtaBlock; onClick: (item: CtaBlock) => void }>;
};
