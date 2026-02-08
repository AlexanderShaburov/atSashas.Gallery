import {
    CatalogCommands,
    ToolbarCtx,
} from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';

export function bindToolbarCtx(args: {
    selectedId?: string;
    canSave: boolean;
    isSaving: boolean;
    tags?: string[];

    commands: CatalogCommands;
}): ToolbarCtx {
    const { selectedId, canSave, isSaving, tags, commands } = args;

    return {
        canSave,
        isSaving,
        tags,

        onAdd: commands.add,
        onEdit: selectedId ? () => commands.editById?.(selectedId) : undefined,
        onDelete: selectedId ? () => commands.deleteById?.(selectedId) : undefined,
        onApply: selectedId ? () => commands.applyById?.(selectedId) : undefined,

        save: commands.save,
        exit: commands.exit,
    };
}
