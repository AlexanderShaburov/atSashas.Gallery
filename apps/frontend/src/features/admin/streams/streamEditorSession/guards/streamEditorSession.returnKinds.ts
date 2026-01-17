// streamEditorSession.returnKinds.ts
import type { ReturnCommand } from '@/shared/nav';

export const STREAM_RETURN_KINDS = [
    'streamInsertBlock',
    'streamReplaceBlock',
    'streamUpdateBlock',
] as const;

export type StreamReturnKind = (typeof STREAM_RETURN_KINDS)[number];
export type StreamReturnCommand = Extract<ReturnCommand, { kind: StreamReturnKind }>;
