// src/shared/ui/ThreeDotMenu/threeDot.types.ts

export type ThreeDotOwner =
    | { kind: 'stream'; streamId: string; blockId: string }
    | { kind: 'block'; blockId: string; artId: string }
    | { kind: 'catalog'; artId: string };

export type ThreeDotAction =
    | { kind: 'insertBlock'; at: 'before' | 'after' }
    | { kind: 'editBlock' }
    | { kind: 'replaceBlock' }
    | { kind: 'deleteBlock' }
    | { kind: 'shift'; dir: 'up' | 'down' }
    | { kind: 'move'; pos: 'end' | 'start' }
    | { kind: 'editArt' }
    | { kind: 'replaceArt' };

export type ThreeDotCommand = {
    owner: ThreeDotOwner;
    action: ThreeDotAction;
};
