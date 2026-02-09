import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { BlockWrapper } from '@/features/admin/streams/ui/Wrapper/BlockWrapper';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import './SingleStreamEditor.css';
import { ThreeDotMenuOverlay, } from '@/shared/ui/ThreeDotMenu/ThreeDotMenuOverlay';
import { useThreeDotController } from '@/shared/ui/ThreeDotMenu/useThreeDotController';
import { useEffect, useMemo } from 'react';
export function SingleStreamEditor({ stream, threeDotMenu, editBlock, toolbarProps }) {
    const gCtx = useEditorWorkspace();
    const collection = gCtx.currentBlocksCollection?.blocks ?? {};
    const threeDot = useThreeDotController({
        buildOwner: ({ streamId, blockId }) => ({ kind: 'stream', streamId, blockId }),
        onCommand: threeDotMenu,
    });
    console.log(`[SingleStreamEditor]: current stream is:`);
    console.dir(stream);
    const items = useMemo(() => [
        { key: 'start', label: 'Move to start', action: { kind: 'move', pos: 'start' } },
        { key: 'up', label: 'Shift up', action: { kind: 'shift', dir: 'up' } },
        { key: 'edit', label: 'Edit block', action: { kind: 'editBlock' } },
        {
            key: 'insBefore',
            label: 'Insert before',
            action: { kind: 'insertBlock', at: 'before' },
        },
        {
            key: 'insAfter',
            label: 'Insert after',
            action: { kind: 'insertBlock', at: 'after' },
        },
        { key: 'replace', label: 'Replace block', action: { kind: 'replaceBlock' } },
        { key: 'del', label: 'Delete block', action: { kind: 'deleteBlock' }, danger: true },
        { key: 'down', label: 'Shift down', action: { kind: 'shift', dir: 'down' } },
        { key: 'end', label: 'Move to end', action: { kind: 'move', pos: 'end' } },
    ], []);
    // Move block to the top
    // Move block up to one position
    // ---------
    // Insert block after
    // Edit block
    // Replace block
    // Delete block
    // ---------
    // Move block down to one position
    // Move block to the end
    //
    // Close only the menu on Escape (don't close the editor here)
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && threeDot.state.isOpen) {
                e.preventDefault();
                e.stopPropagation();
                threeDot.close();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [threeDot]);
    // Stream changed => close menu to avoid stale owner
    useEffect(() => {
        threeDot.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream.streamId]);
    return (_jsxs("div", { className: "sse", children: [_jsx("div", { className: "sse__feed", children: stream.blockIds.map((id) => {
                    const block = collection[id] ?? null;
                    if (!block) {
                        return (_jsx("div", { className: "sse__not_found", "data-block-id": id, children: "Block not found" }, id));
                    }
                    return (_jsx("div", { className: "sse__block", "data-block-id": id, children: _jsx(BlockWrapper, { threeDotMenu: {
                                toggle: (el) => threeDot.toggleFromEvent({
                                    streamId: stream.streamId,
                                    blockId: id,
                                    el,
                                }),
                                close: threeDot.close,
                            }, children: _jsx(BlockRenderer, { block: block, onHit: (hit) => editBlock(hit.block.id), parent: "streamEditor", readOnly: true }, id) }) }, id));
                }) }), _jsx(ThreeDotMenuOverlay, { isOpen: threeDot.state.isOpen, owner: threeDot.state.owner, anchorRect: threeDot.state.anchor?.rect ?? null, items: items, onSelect: threeDot.select, onClose: threeDot.close }), _jsx("div", { className: "set__toolbar", children: _jsx(SingleEditorToolbar, { tools: ['delete', 'tags', 'add', 'edit', 'exit', 'save'], ctx: toolbarProps }) })] }));
}
