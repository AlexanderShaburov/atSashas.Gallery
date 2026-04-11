import { JumpResult } from './journey.types';

export type EditorKind = 'stream' | 'block' | 'catalog' | 'hopper' | 'events' | 'eventPages' | 'home' | 'textVisuals' | 'mediaItems';

export type EditorKey =
    | { kind: 'stream'; id: string }
    | { kind: 'block'; id: string }
    | { kind: 'catalog'; id: string | 'main' }
    | { kind: 'hopper'; id: 'main' }
    | { kind: 'home'; id: 'home-doc' }
    | { kind: 'events'; id: string }
    | { kind: 'eventPages'; id: string }
    | { kind: 'textVisuals'; id: string }
    | { kind: 'mediaItems'; id: string };

export type OkJumpResult = Extract<JumpResult, { ok: true }>;
