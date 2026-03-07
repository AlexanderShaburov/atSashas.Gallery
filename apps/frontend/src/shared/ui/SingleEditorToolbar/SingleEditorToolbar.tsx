// src/shared/ui/SingleEditorToolbar/SingleEditorToolbar.tsx

import { Fragment } from 'react';
import './SingleEditorToolbar.css';
import { TOOL_REGISTRY } from './single-editor-toolbar.constants';
import { ToolbarCtx, ToolKey } from './single-editor-toolbar.types';

const TOOL_GROUPS: { left: ToolKey[]; center: ToolKey[]; right: ToolKey[] } = {
    left: ['delete', 'add', 'addEvent', 'customize', 'edit'],
    center: ['tags'],
    right: ['publish', 'unpublish', 'save', 'apply', 'exit'],
};

type SingleEditorToolbarProps = {
    tools: ToolKey[];
    ctx: ToolbarCtx;
};

export function SingleEditorToolbar({ tools, ctx }: SingleEditorToolbarProps) {
    const renderGroup = (groupKeys: ToolKey[]) =>
        groupKeys
            .filter((key) => tools.includes(key))
            .map((key) => {
                const renderer = TOOL_REGISTRY[key];
                if (typeof renderer !== 'function') return null;
                const el = renderer(ctx);
                if (!el) return null;
                return <Fragment key={key}>{el}</Fragment>;
            });

    return (
        <div className="set-wrap">
            <div className="set-group set-group--left">{renderGroup(TOOL_GROUPS.left)}</div>
            <div className="set-group set-group--center">{renderGroup(TOOL_GROUPS.center)}</div>
            <div className="set-group set-group--right">{renderGroup(TOOL_GROUPS.right)}</div>
        </div>
    );
}
