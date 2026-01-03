export type ToolKey = 'delButton' | 'tags' | 'addBlock' | 'exit' | 'save';

export type ToolbarCtx = {
    canSave: boolean;
    saving: boolean;
    save: () => void;
    exit: () => void;
    onDelete: () => void;

    addBlock?: (pos: number) => void;
    tags?: string[];
    onChangeTags?: (tags: string[]) => void;
};
