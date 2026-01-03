// src/shared/ui/SingleEditorToolbar/single-editor-toolbar.constants.tsx

import { ReactNode } from 'react';
import type { ToolKey, ToolbarCtx } from './single-editor-toolbar.types';
import {
    AddBlockButton,
    DeleteButton,
    ExitButton,
    SaveButton,
    TagsEditor,
} from './ToolbarElements';

import { resolveAnyClick } from '@/shared/lib/resolvers/resolvers';
type ToolRenderer = (ctx: ToolbarCtx) => ReactNode;

export const TOOL_REGISTRY: Record<ToolKey, ToolRenderer> = {
    delButton: (ctx) => <DeleteButton exit={ctx.onDelete} />,
    addBlock: (ctx) => <AddBlockButton onClick={resolveAnyClick(ctx.addBlock)} />,
    exit: (ctx) => <ExitButton exit={ctx.exit} />,
    save: (ctx) => <SaveButton onClick={ctx.save} canSave={ctx.canSave} saving={ctx.saving} />,
    tags: (ctx) => (
        <TagsEditor onCommit={resolveAnyClick(ctx.onChangeTags)} tags={ctx.tags ?? []} />
    ),
    // 'addBlock': (ctx) => <AddBlockButton onclick={ctx.addBlock} />,
};
