export type EditorKind = 'stream' | 'block' | 'catalog' | 'hopper';

export type EditorKey =
    | { kind: 'stream'; id: string }
    | { kind: 'block'; id: string }
    | { kind: 'catalog'; id: 'main' }
    | { kind: 'hopper'; id: 'main' };
