import { JumpResult } from './journey.types';

export type EditorKind = 'stream' | 'block' | 'catalog' | 'hopper' | 'events';

export type EditorKey =
    | { kind: 'stream'; id: string }
    | { kind: 'block'; id: string }
    | { kind: 'catalog'; id: string | 'main' }
    | { kind: 'hopper'; id: 'main' };

export type OkJumpResult = Extract<JumpResult, { ok: true }>;
