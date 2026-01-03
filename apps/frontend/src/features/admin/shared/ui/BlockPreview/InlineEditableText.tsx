//src/features/admin/blocks/ui/BlockPreview/InlineEditableText.tsx

import { Block, EditTarget } from '@/entities/block';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHit } from '@/features/admin/blocks/ui/BlockTemplates';
import { useEffect, useState } from 'react';

export type InlineEditableTextProps = {
    block: Block;
    target: EditTarget;
    currentTextValue: string;
    className: string;
    hit: BlockHit;
    onCommit: (t: string | undefined) => void;
    children: (displayProps: {
        role: 'button';
        tabIndex: number;
        className: string;
        onClick: (e: React.MouseEvent<HTMLElement>) => void;
    }) => React.ReactNode;
};
export function InlineEditableText(props: InlineEditableTextProps) {
    const { block, target, currentTextValue, hit, children, className, onCommit } = props;
    const session = useBlockEditorSession();

    const isEditing = session.isEditingTarget(target);
    const [draftText, setDraftText] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (isEditing) setDraftText(currentTextValue);
    }, [isEditing, currentTextValue]);

    const commitAndClose = () => {
        onCommit(draftText);
        session.unHit();
    };

    if (!isEditing) {
        return children({
            role: 'button',
            tabIndex: 0,
            className: className,
            onClick: (e) => session.onHit({ block, hit: hit, nativeEvent: e }),
        });
    }
    return (
        <input
            autoFocus
            className={`${className} blk-inline-input`}
            value={draftText ?? ''}
            onChange={(e) => {
                setDraftText(e.target.value);
            }}
            onBlur={commitAndClose}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commitAndClose();
                if (e.key === 'Escape') {
                    setDraftText(undefined);
                    session.unHit();
                }
            }}
        />
    );
}
