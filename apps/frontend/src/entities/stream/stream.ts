import { Block } from '@/entities/block';
import { Localized } from '@/entities/common';

export interface StreamData {
    slug: string;
    title?: Localized;
    description?: Localized;
    blocks: Block[];
}
