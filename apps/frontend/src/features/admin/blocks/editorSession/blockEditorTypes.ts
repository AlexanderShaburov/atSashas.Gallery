// src/features/admin/blocks/editorSession/blockEditorTypes.ts

import type {
    Block,
    BlockEditorMode,
    BlockEditorScreenMode,
    BlocksCollectionJSON,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';
import type { BlockFormValue } from '@/features/admin/blocks/editorSession/blockFormValueTypes';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';

export type BlockEditorTarget = { mode: 'create' } | { mode: 'edit'; block: Block };

export type BlockEditorSession = {
    /** Which block we are working with (create or edit existing) */
    selectedBlock: Block | undefined;

    /** Current mode (mostly mirrors identity.mode, but convenient for UI) */
    mode: BlockEditorMode;

    /** Working form values for the block (formValue) */
    values: BlockFormValue | undefined;
    collection?: BlocksCollectionJSON;
    screenMode: BlockEditorScreenMode;
    setValues: React.Dispatch<React.SetStateAction<BlockFormValue | undefined>>;
    setSelectedBlock: (v: Block | undefined) => void;
    setMode: (m: BlockEditorMode) => void;
    setScreenMode: (m: BlockEditorScreenMode) => void;
    setCollection: (c: BlocksCollectionJSON | undefined) => void;
    onHit: (h: BlockHitEvent) => void;
    onDelete: () => void;
    updateTags: (t: string[]) => void;

    /** Editor lifecycle */
    editorIsReady: boolean;

    /** Derived flags */
    isDirty: boolean;
    isValid: boolean;
    canSave: boolean;
    loading: boolean;

    /** Persistence controls */
    saving: boolean;
    save: () => Promise<void> | void;
    exit: () => void;

    /** UI helpers (optional, can extend later) */
    // UI error state:
    uiError: UiErrorState | undefined;
    // currentLayoutPreview?: Block['layout'];
};
