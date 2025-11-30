// src/features/admin/blocks/editorSession/blockEditorTypes.ts

import type { Block, BlocksCollectionJSON, CollectionsList } from '@/entities/block';
import type { BlockFormValue } from '@/features/admin/blocks/editorSessionContext/blockFormValueTypes';

export type BlockEditorMode = 'create' | 'edit';

export type BlockEditorTarget = { mode: 'create' } | { mode: 'edit'; block: Block };

export type BlockEditorSession = {
    /** Full list of blocks loaded from backend / JSON */
    collectionsList: CollectionsList | undefined;

    /** Which block we are working with (create or edit existing) */
    identity: Block | undefined;

    /** Current mode (mostly mirrors identity.mode, but convenient for UI) */
    mode: BlockEditorMode;

    /** Working form values for the block (formValue) */
    values: BlockFormValue | undefined;
    collection?: BlocksCollectionJSON;
    setValues: React.Dispatch<React.SetStateAction<BlockFormValue | undefined>>;
    setIdentity: (v: Block | undefined) => void;
    setMode: (m: BlockEditorMode) => void;
    setCollection: (c: BlocksCollectionJSON | undefined) => void;
    newCollection: (n: string) => void;

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
