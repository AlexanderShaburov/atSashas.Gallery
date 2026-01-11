// src/shared/nav/ReturnStack.types.ts
import { ItemPosition } from '@/entities/block';

type StreamInsertAt =
    | { kind: 'afterBlockId'; afterBlockId: string }
    | { kind: 'index'; index: number };

export type ReturnCommand =
    | {
          kind: 'streamInsertBlock';
          streamId: string;
          insertAt: StreamInsertAt;
          focus?: { blockId: string };
      }
    | {
          kind: 'streamUpdateBlock';
          streamId: string;
          blockId: string;
          focus?: { blockId: string };
      }
    | {
          kind: 'blockInsertArt';
          blockId: string;
          position: ItemPosition;
      }
    | {
          kind: 'blockUpdateArt';
          blockId: string;
          position: ItemPosition;
      };

export type JourneyLeg = 'outbound' | 'return';

export type JumpResult =
    | { ok: true; id: string }
    | { ok: false; reason?: 'cancel' | 'back' | 'error' };

export type Address =
    | { kind: 'streamsIndex' }
    | { kind: 'streamEditor'; streamId: string }
    | { kind: 'blockEditor'; blockId?: string }
    | { kind: 'catalogEditor'; artItemId?: string };

export type JourneyTicket = {
    journeyId: string;
    destination: Address;
    returnTo: Address;
    phase: JourneyLeg;
    nonce: string;
    createdAt: string;
    command?: ReturnCommand;
    loot?: JumpResult;
};
