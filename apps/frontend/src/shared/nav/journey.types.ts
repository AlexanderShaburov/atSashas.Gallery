// src/shared/nav/ReturnStack.types.ts
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { EditorKind } from './editorKey.types';
import { GridItem } from '@/entities/grid';

export type EditorKey =
    | { kind: 'stream'; id: string }
    | { kind: 'block'; id: string }
    | { kind: 'catalog'; id: 'main' }
    | { kind: 'hopper'; id: 'main' };

/**
 * Serializable version of BlockHitEvent (without nativeEvent to avoid circular refs in JSON)
 * Used in journey tickets which get serialized/logged
 */
export type SerializableBlockHitEvent = Omit<BlockHitEvent, 'nativeEvent'>;

// What editor should do as return on parent editor
// created entity id is in the JumpResult type data (loot)
export type ReturnCommand =
    | {
          kind: 'streamInsertBlock';
          streamId: string;
          insertAt: number;
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
          pendingSelection: SerializableBlockHitEvent;
      }
    | {
          kind: 'blockUpdateArt';
          blockId: string;
          pendingSelection: SerializableBlockHitEvent;
      }
    | {
          kind: 'createArtItem';
          itemId: string;
      };

// Phase of journey:
export type JourneyLeg = 'outbound' | 'return';

export type JumpResult =
    | { ok: true; id: string; output?: GridItem }
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
