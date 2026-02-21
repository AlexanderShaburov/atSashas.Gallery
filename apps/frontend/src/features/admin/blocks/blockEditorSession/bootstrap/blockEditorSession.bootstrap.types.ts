import type { JumpResult } from '@/shared/nav/journey.types';

export type BlockReturnKind = 'blockInsertArt' | 'blockUpdateArt' | 'blockSetEventId' | 'blockSetEventBackground';

export type OkJumpResult = Extract<JumpResult, { ok: true }>;

// export type BlockReturnBootstrapValidated = {
//     ticket: JourneyTicket;
//     command: Extract<ReturnCommand, { kind: BlockReturnKind }>;
//     blockId: string;
//     position: ItemPosition;
//     loot: OkJumpResult;
// };
