// src/shared/ui/SingleEditorToolbar/single-editor-toolbar.types.ts

export type ToolKey =
    | 'add'
    | 'customize'
    | 'edit'
    | 'delete'
    | 'apply'
    | 'save'
    | 'exit'
    | 'tags';

export type ToolbarCtx = {
    // Derived states:
    canSave: boolean;
    isSaving: boolean;

    // Toolbar data access:
    tags?: string[];

    // Toolbar action handlers:
    onAdd?: () => void;
    onCustomize?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onApply?: () => void;
    save?: () => void;
    exit: () => void;
    onChangeTags?: (tags: string[]) => void;
};
export type CatalogToolbarModel = {
    // Derived:
    canSave: boolean;
    isSaving: boolean;
    tags?: string[];

    // Domain commands
    commands: CatalogCommands;
};
export type CatalogCommands = {
    add?: () => void;
    editById?: (id: string) => void;
    deleteById?: (id: string) => void;
    applyById?: (id: string) => void;
    exit: () => void;
    save?: () => void; // save current edit scope;
    onChangeTags?: (tags: string[]) => void;
};
