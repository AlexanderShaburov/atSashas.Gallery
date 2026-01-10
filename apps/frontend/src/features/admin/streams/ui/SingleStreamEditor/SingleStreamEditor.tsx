// src/features/admin/streams/ui/SingleStreamEditor/SingleStreameEditor.tsx

import { StreamData } from '@/entities/stream';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { BlockWrapper } from '@/features/admin/streams/ui/Wrapper/BlockWrapper';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import './SingleStreamEditor.css';

type Props = {
    stream: StreamData;
    threeDotMenu: (id: string) => void;
    editBlock: (id: string) => void;
    toolbarProps: {
        canSave: boolean;
        saving: boolean;
        addBlock?: (pos: number) => void;
        save: () => void;
        exit: () => void;
        onDelete: () => void;
        onChangeTags?: (tags: string[]) => void;
    };
};

export function SingleStreamEditor({ stream, threeDotMenu, editBlock, toolbarProps }: Props) {
    const gCtx = useEditorWorkspace();
    const collection = gCtx.currentBlocksCollection?.blocks ?? {};

    return (
        <div className="sse">
            <div className="sse__feed">
                {stream.blockIds.map((id) => {
                    const block = collection[id] ? collection[id] : null;
                    if (!block)
                        return (
                            <div key={id} className="sse__not_found">
                                Block not found
                            </div>
                        );
                    return (
                        <div key={id} className="sse__block">
                            <BlockWrapper blockId={id} threeDotMenu={threeDotMenu}>
                                <BlockRenderer
                                    key={id}
                                    block={block}
                                    onHit={(hit) => editBlock(hit.block.id)}
                                    parent={'streamEditor'}
                                />
                            </BlockWrapper>
                        </div>
                    );
                })}
            </div>
            <div className="set__toolbar">
                <SingleEditorToolbar
                    tools={['delButton', 'tags', 'addBlock', 'exit', 'save']}
                    ctx={toolbarProps}
                />
            </div>
        </div>
    );
}
