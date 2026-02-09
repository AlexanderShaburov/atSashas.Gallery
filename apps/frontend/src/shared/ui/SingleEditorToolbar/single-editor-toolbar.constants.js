import { jsx as _jsx } from "react/jsx-runtime";
import { AddBlockButton, ApplyButton, DeleteButton, EditMetadata, ExitButton, SaveButton, TagsEditor, } from './ToolbarElements';
import { resolveAnyClick } from '@/shared/lib/resolvers/resolvers';
/**
 * IMPORTANT:
 * ToolbarCtx handlers are optional.
 * If handler is absent -> button is not rendered.
 * (Toolbar decides visibility, not button)
 */
export const TOOL_REGISTRY = {
    add: (ctx) => (ctx.onAdd ? _jsx(AddBlockButton, { onClick: resolveAnyClick(ctx.onAdd) }) : null),
    edit: (ctx) => (ctx.onEdit ? _jsx(EditMetadata, { onEdit: resolveAnyClick(ctx.onEdit) }) : null),
    delete: (ctx) => ctx.onDelete ? _jsx(DeleteButton, { onDelete: resolveAnyClick(ctx.onDelete) }) : null,
    apply: (ctx) => (ctx.onApply ? _jsx(ApplyButton, { onApply: resolveAnyClick(ctx.onApply) }) : null),
    save: (ctx) => ctx.save ? (_jsx(SaveButton, { onClick: resolveAnyClick(ctx.save), canSave: ctx.canSave, saving: ctx.isSaving })) : null,
    exit: (ctx) => (ctx.exit ? _jsx(ExitButton, { onExit: resolveAnyClick(ctx.exit) }) : null),
    tags: (ctx) => ctx.onChangeTags ? (_jsx(TagsEditor, { onCommit: resolveAnyClick(ctx.onChangeTags), tags: ctx.tags ?? [] })) : null,
};
