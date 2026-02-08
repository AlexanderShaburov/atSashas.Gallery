// src/features/admin/streams/ui/SingleStreamEditor/SingleStreamEditor.tsx

import { StreamData } from '@/entities/stream';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { BlockWrapper } from '@/features/admin/streams/ui/Wrapper/BlockWrapper';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import './SingleStreamEditor.css';

import { ToolbarCtx } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { ThreeDotCommand } from '@/shared/ui/ThreeDotMenu/threeDot.types';
import {
    ThreeDotMenuItem,
    ThreeDotMenuOverlay,
} from '@/shared/ui/ThreeDotMenu/ThreeDotMenuOverlay';
import { useThreeDotController } from '@/shared/ui/ThreeDotMenu/useThreeDotController';
import { useEffect, useMemo } from 'react';

type Props = {
    stream: StreamData;
    threeDotMenu: (command: ThreeDotCommand) => void; // executes in session
    editBlock: (id: string) => void;
    toolbarProps: ToolbarCtx;
};

export function SingleStreamEditor({ stream, threeDotMenu, editBlock, toolbarProps }: Props) {
    const gCtx = useEditorWorkspace();
    const collection = gCtx.currentBlocksCollection?.blocks ?? {};

    const threeDot = useThreeDotController<{ streamId: string; blockId: string }>({
        buildOwner: ({ streamId, blockId }) => ({ kind: 'stream', streamId, blockId }),
        onCommand: threeDotMenu,
    });
    console.log(`[SingleStreamEditor]: current stream is:`);
    console.dir(stream);

    const items: ThreeDotMenuItem[] = useMemo(
        () => [
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
        ],
        [],
    );

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
        const onKeyDown = (e: KeyboardEvent) => {
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

    return (
        <div className="sse">
            <div className="sse__feed">
                {stream.blockIds.map((id) => {
                    const block = collection[id] ?? null;

                    if (!block) {
                        return (
                            <div key={id} className="sse__not_found" data-block-id={id}>
                                Block not found
                            </div>
                        );
                    }

                    return (
                        <div key={id} className="sse__block" data-block-id={id}>
                            <BlockWrapper
                                threeDotMenu={{
                                    toggle: (el: HTMLElement) =>
                                        threeDot.toggleFromEvent({
                                            streamId: stream.streamId,
                                            blockId: id,
                                            el,
                                        }),
                                    close: threeDot.close,
                                }}
                            >
                                <BlockRenderer
                                    key={id}
                                    block={block}
                                    onHit={(hit) => editBlock(hit.block.id)}
                                    parent="streamEditor"
                                    readOnly={true}
                                />
                            </BlockWrapper>
                        </div>
                    );
                })}
            </div>

            <ThreeDotMenuOverlay
                isOpen={threeDot.state.isOpen}
                owner={threeDot.state.owner}
                anchorRect={threeDot.state.anchor?.rect ?? null}
                items={items}
                onSelect={threeDot.select}
                onClose={threeDot.close}
            />

            <div className="set__toolbar">
                <SingleEditorToolbar
                    tools={['delete', 'tags', 'add', 'edit', 'exit', 'save']}
                    ctx={toolbarProps}
                />
            </div>
        </div>
    );
}
