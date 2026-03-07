// src/features/admin/blocks/editorSession/blockEditorTypes.ts

import type {
    Block,
    BlockAppearance,
    // BlockEditorMode,
    BlockEditorScreenMode,
    BlockHitEvent,
    BlocksCollectionJSON,
    EditTarget,
    ItemPosition,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';

export type BlockEditorTarget = { mode: 'create' } | { mode: 'edit'; block: Block };

export interface ScreenModeStack {
    screenMode: BlockEditorScreenMode;
    onEscape: () => void;
}

export type BlockEditorSession = {
    /** Working form values for the block (formValue) */
    draft: Block | undefined;
    collection?: BlocksCollectionJSON;
    setDraft: (next: Block) => void;
    // setMode: (m: BlockEditorMode) => void;
    currentStack: ScreenModeStack;
    // setSelectedArtItem: (i: GridItem | undefined) => void;
    onHit: (h: BlockHitEvent) => void;
    unHit: () => void;
    onDelete: () => void;
    updateTags: (t: string[]) => void;
    onApply: () => void;

    /** Add event placeholder at a gallery slot and dispatch journey to event editor */
    addEventAndJourney: (pos: ItemPosition) => void;
    /** Update a gallery item caption */
    updateItemCaption: (pos: ItemPosition, caption: string) => void;
    /** Update the block-level caption */
    updateBlockCaption: (caption: string) => void;

    /** Editor lifecycle */
    // editorIsReady: boolean;
    isEditingTarget: (t: EditTarget) => boolean;

    /** Derived flags */
    isDirty: boolean;
    isValid: boolean;
    canSave: boolean;
    loading: boolean;
    isJourney: boolean;

    /** Persistence controls */
    saving: boolean;
    onSaveClick: () => Promise<void> | void;
    exit: () => void;

    /** Appearance customizer */
    enterCustomize: () => void;
    exitCustomize: () => void;
    appearanceDraft: BlockAppearance | undefined;
    setAppearanceDraft: (app: BlockAppearance) => void;
    saveAppearance: () => Promise<void>;

    /** UI helpers (optional, can extend later) */
    // UI error state:
    uiError: UiErrorState | undefined;
    // currentLayoutPreview?: Block['layout'];
};
