export function bindToolbarCtx(args) {
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
