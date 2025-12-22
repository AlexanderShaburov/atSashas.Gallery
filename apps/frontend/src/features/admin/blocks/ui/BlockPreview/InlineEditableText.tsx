//src/features/admin/blocks/ui/BlockPreview/InlineEditableText.tsx

import { Block, EditTarget } from '@/entities/block';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHit } from '@/features/admin/blocks/ui/BlockTemplates';
import { useEffect, useState } from 'react';

// children -> what we pass to derivative HTML Element
// Own props -> what we need to build <input />

/* 
role                |
className           | -> child element params
onClick             | 
some {abc}              ->  as children 

****************************************************
****************************************************

To build onHIt we need spotter, block and looks like current value to set as 
draft and initial input value. (despite having in children)
And we need to know target to decide what to return
!!! And we need setter to set new text value!!!! The setter has to be defined where the component is called.
Thus we have:
*/
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
    console.log('[InlineEditableText]: ');
    console.log(`[InlineEditableText]: isEditing calculated as: ${isEditing}`);
    const [draftText, setDraftText] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (isEditing) setDraftText(currentTextValue);
    }, [isEditing, currentTextValue]);

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
            value={draftText ?? ''}
            onChange={(e) => {
                setDraftText(e.target.value);
            }}
            onBlur={() => {
                onCommit(draftText);
                session.unHit();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onCommit(draftText);
                    session.unHit();
                }
                if (e.key === 'Escape') {
                    setDraftText(undefined);
                    session.unHit();
                }
            }}
        />
    );
}
