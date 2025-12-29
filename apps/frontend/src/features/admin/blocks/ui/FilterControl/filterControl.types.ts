import { BlockKind, GalleryLayout } from '@/entities/block';
import { CtaTypes } from '@/entities/block/block.types';

export type BlockFilterState = {
    tags: string[];
    kind?: BlockKind;
    layout?: GalleryLayout;
    ctaType?: CtaTypes;
    artName?: string;
    extended: boolean;
};
