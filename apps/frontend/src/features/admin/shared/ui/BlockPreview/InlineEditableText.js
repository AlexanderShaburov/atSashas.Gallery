import { jsx as _jsx } from "react/jsx-runtime";
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { useEffect, useState } from 'react';
export function InlineEditableText(props) {
    const { block, target, currentTextValue, hit, children, className, onCommit } = props;
    const session = useBlockEditorSession();
    const isEditing = session.isEditingTarget(target);
    const [draftText, setDraftText] = useState(undefined);
    useEffect(() => {
        if (isEditing)
            setDraftText(currentTextValue);
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
    return (_jsx("input", { autoFocus: true, className: `${className} blk-inline-input`, value: draftText ?? '', onChange: (e) => {
            setDraftText(e.target.value);
        }, onBlur: commitAndClose, onKeyDown: (e) => {
            if (e.key === 'Enter')
                commitAndClose();
            if (e.key === 'Escape') {
                setDraftText(undefined);
                session.unHit();
            }
        } }));
}
