// src/features/admin/blocks/editorSession/blockEditorTypes.ts

import type { Block } from '@/entities/block';
import type { BlockFormValue } from '@/features/admin/blocks/editorSessionContext/blockFormValueTypes';

export type BlockEditorMode = 'create' | 'edit';

export type BlockEditorTarget = { mode: 'create' } | { mode: 'edit'; block: Block };

export type BlockEditorSession = {
    /** Full list of blocks loaded from backend / JSON */
    blocks: Block[] | undefined;

    /** Which block we are working with (create or edit existing) */
    identity: BlockEditorTarget | undefined;

    /** Current mode (mostly mirrors identity.mode, but convenient for UI) */
    mode: BlockEditorMode;

    /** Working form values for the block (formValue) */
    values: BlockFormValue | undefined;
    setValues: React.Dispatch<React.SetStateAction<BlockFormValue | undefined>>;
    setIdentity: (v: BlockEditorTarget | undefined) => void;
    setMode: (m: BlockEditorMode) => void;

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
    // currentLayoutPreview?: Block['layout'];
};
