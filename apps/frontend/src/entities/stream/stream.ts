import { Block, LegacyBlock } from '@/entities/block';
import { Localized } from '../common';

export interface LegacyStreamData {
    title: string;
    blocks: LegacyBlock[];
}
export interface LegacyStream {
    blocks: LegacyBlock[];
    title: string;
}
export interface StreamData {
    slug: string;
    title?: Localized;
    description?: Localized;
    blocks: Block[];
}
