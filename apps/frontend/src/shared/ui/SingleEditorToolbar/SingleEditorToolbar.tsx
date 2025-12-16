//src/shared/ui/SingleEditorToolbar/SingleEditorToolbar.tsx

import './SingleEditorToolbar.css';
type SingleEditorToolbarProps = {
    canSave: boolean;
    saving: boolean;
    save: () => void;
    exit: () => void;
    onDelete: () => void;
};
export function SingleEditorToolbar(props: SingleEditorToolbarProps) {
    console.log('SingleEditorToolbar render');
    return (
        <div className="set-wrap">
            {' '}
            <div className="set-actions set-actions--left">
                <button type="button" className="set-btn set-btn--danger" onClick={props.onDelete}>
                    🗑 Delete
                </button>
            </div>
            <div className="set-actions set-actions--right">
                <button
                    type="button"
                    className="set-btn set-btn--secondary"
                    onClick={() => props.exit()}
                >
                    ✖ Exit
                </button>
                <button
                    type="button"
                    className="set-btn set-btn--primary"
                    disabled={!props.canSave || props.saving}
                    onClick={() => !props.saving && props.canSave && props.save()}
                    title={
                        !props.canSave
                            ? 'Complete required fields'
                            : props.saving
                              ? 'Saving...'
                              : 'Save'
                    }
                >
                    {props.canSave ? '💾 Save' : 'Saving…'}
                </button>
            </div>
        </div>
    );
}
