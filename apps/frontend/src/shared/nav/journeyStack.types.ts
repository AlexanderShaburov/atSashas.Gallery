// src/shared/nav/ReturnStack.types.ts
import { ItemPosition } from '@/entities/block';
import { EditorKind } from './editorKey.types';

export type EditorKey =
    | { kind: 'stream'; id: string }
    | { kind: 'block'; id: string }
    | { kind: 'catalog'; id: 'main' }
    | { kind: 'hopper'; id: 'main' };

type StreamInsertAt =
    | { kind: 'afterBlockId'; afterBlockId: string }
    | { kind: 'index'; index: number };

// What editor should do as return on parent editor
// created entity id is in the JumpResult type data (loot)
export type ReturnCommand =
    | {
          kind: 'streamInsertBlock';
          streamId: string;
          insertAt: StreamInsertAt;
          focus?: { blockId: string };
      }
    | {
          kind: 'streamReplaceBlock';
          streamId: string;
          replaceBlockId: string;
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

// Phase of journey:
export type JourneyLeg = 'outbound' | 'return';

export type JumpResult =
    | { ok: true; id: string }
    | { ok: false; reason?: 'cancel' | 'back' | 'error' };

export type ToAddress =
    | { editor: 'hopper'; mode: 'select' }
    | { editor: Exclude<EditorKind, 'hopper'>; mode: 'select' }
    | { editor: Exclude<EditorKind, 'hopper'>; mode: 'edit'; objectId: string };

export type ReturnAddress = {
    editor: Exclude<EditorKind, 'hopper'>;
    mode: 'edit';
    objectId: string;
};

export type JourneyTicket = {
    journeyId: string;

    destination: ToAddress;
    returnTo: ReturnAddress;

    phase: JourneyLeg;
    nonce: string;
    createdAt: string;

    returnEffect: ReturnCommand | undefined;
    loot?: JumpResult;
};
