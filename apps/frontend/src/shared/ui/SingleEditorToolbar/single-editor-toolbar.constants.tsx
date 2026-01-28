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

const plug = () => {};

import { resolveAnyClick } from '@/shared/lib/resolvers/resolvers';
type ToolRenderer = (ctx: ToolbarCtx) => ReactNode;

export const TOOL_REGISTRY: Record<ToolKey, ToolRenderer> = {
    delButton: (ctx) => <DeleteButton exit={ctx.onDelete} />,
    addBlock: (ctx) => <AddBlockButton onClick={resolveAnyClick(ctx.addBlock)} />,
    editMeta: (ctx) => (ctx.onEditMetadata ? <EditMetadata onEdit={ctx.onEditMetadata} /> : null),
    exit: (ctx) => <ExitButton exit={ctx.exit} />,
    save: (ctx) => <SaveButton onClick={ctx.save} canSave={ctx.canSave} saving={ctx.saving} />,
    tags: (ctx) => (
        <TagsEditor onCommit={resolveAnyClick(ctx.onChangeTags)} tags={ctx.tags ?? []} />
    ),
    apply: (ctx) => <ApplyButton onApply={ctx.onApply ? ctx.onApply : plug} />,
    // 'addBlock': (ctx) => <AddBlockButton onclick={ctx.addBlock} />,
};
