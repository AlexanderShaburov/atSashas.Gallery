export type ToolKey = 'delButton' | 'tags' | 'addBlock' | 'exit' | 'save' | 'editMeta' | 'apply';

export type ToolbarCtx = {
    canSave: boolean;
    saving: boolean;
    save: () => void;
    exit: () => void;
    onDelete: () => void;
    onEditMetadata?: () => void;
    addBlock?: () => void;
    tags?: string[];
    onChangeTags?: (tags: string[]) => void;
    onApply?: () => void;
};
