// src/shared/ui/SingleEditorToolbar/SingleEditorToolbar.tsx

import './SingleEditorToolbar.css';
import { TOOL_REGISTRY } from './single-editor-toolbar.constants';
import { ToolbarCtx, ToolKey } from './single-editor-toolbar.types';

type PosClass = 'set-actions--left' | 'set-actions--right' | 'set-tags';

type SingleEditorToolbarProps = {
    tools: ToolKey[];
    ctx: ToolbarCtx;
};

export function SingleEditorToolbar(props: SingleEditorToolbarProps) {
    const ctx = props.ctx;
    const len = props.tools.length;
    const getPos = (index: number, len: number): PosClass => {
        if (index === 0) return 'set-actions--left';
        if (index >= len - 3) return 'set-actions--right';
        return 'set-tags';
    };
    return (
        <div className="set-wrap">
            {props.tools.map((e, index) => {
                const renderer = TOOL_REGISTRY[e];
                if (typeof renderer !== 'function') {
                    console.error('Unknown tool key:', e, 'available:', Object.keys(TOOL_REGISTRY));
                    return null;
                }
                return (
                    <span key={index} className={getPos(index, len)}>
                        {renderer(ctx)}
                    </span>
                );
            })}
        </div>
    );
}
