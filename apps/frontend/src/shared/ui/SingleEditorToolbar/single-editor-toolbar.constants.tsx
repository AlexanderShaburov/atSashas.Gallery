// src/shared/ui/SingleEditorToolbar/single-editor-toolbar.constants.tsx

import { ReactNode } from 'react';
import type { ToolKey, ToolbarCtx } from './single-editor-toolbar.types';
import {
    AddBlockButton,
    ApplyButton,
    DeleteButton,
    EditMetadata,
    ExitButton,
    SaveButton,
    TagsEditor,
} from './ToolbarElements';

import { resolveAnyClick } from '@/shared/lib/resolvers/resolvers';

type ToolRenderer = (ctx: ToolbarCtx) => ReactNode | null;

/**
 * IMPORTANT:
 * ToolbarCtx handlers are optional.
 * If handler is absent -> button is not rendered.
 * (Toolbar decides visibility, not button)
 */

export const TOOL_REGISTRY: Record<ToolKey, ToolRenderer> = {
    add: (ctx) => (ctx.onAdd ? <AddBlockButton onClick={resolveAnyClick(ctx.onAdd)} /> : null),

    edit: (ctx) => (ctx.onEdit ? <EditMetadata onEdit={resolveAnyClick(ctx.onEdit)} /> : null),

    delete: (ctx) =>
        ctx.onDelete ? <DeleteButton onDelete={resolveAnyClick(ctx.onDelete)} /> : null,

    apply: (ctx) => (ctx.onApply ? <ApplyButton onApply={resolveAnyClick(ctx.onApply)} /> : null),

    save: (ctx) =>
        ctx.save ? (
            <SaveButton
                onClick={resolveAnyClick(ctx.save)}
                canSave={ctx.canSave}
                saving={ctx.isSaving}
            />
        ) : null,

    exit: (ctx) => (ctx.exit ? <ExitButton onExit={resolveAnyClick(ctx.exit)} /> : null),

    tags: (ctx) =>
        ctx.onChangeTags ? (
            <TagsEditor onCommit={resolveAnyClick(ctx.onChangeTags)} tags={ctx.tags ?? []} />
        ) : null,
};
