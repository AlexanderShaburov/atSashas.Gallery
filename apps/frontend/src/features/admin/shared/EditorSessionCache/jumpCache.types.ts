import { Block } from '@/entities/block';
import { ArtCatalog } from '@/entities/catalog';
import { StreamData } from '@/entities/stream';
import { ReturnCommand } from '@/shared/nav/journeyStack.types';

export type EditorKind = 'stream' | 'block' | 'catalog';

type DraftSnapshot<T> = {
    snapshot: T;
    draft: T;
    updatedAt: string;
};

export type StreamEditEntry = {
    kind: 'stream';
    id: string;
    data: DraftSnapshot<StreamData>;
    ui?: {
        jump?: ReturnCommand;
        focus?: { kind: 'blockId' | 'field'; value: string };
    };
};

export type BlockEditEntry = {
    kind: 'block';
    id: string;
    data: DraftSnapshot<Block>;
};

export type CatalogEditEntry = {
    kind: 'catalog';
    id: string;
    data: DraftSnapshot<ArtCatalog>;
};

export type EditCacheEntry = StreamEditEntry | BlockEditEntry | CatalogEditEntry;
