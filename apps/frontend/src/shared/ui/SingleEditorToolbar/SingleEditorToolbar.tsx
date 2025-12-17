// src/shared/ui/SingleEditorToolbar/SingleEditorToolbar.tsx

import { useState } from 'react';
import './SingleEditorToolbar.css';

type SingleEditorToolbarProps = {
    canSave: boolean;
    saving: boolean;
    save: () => void;
    exit: () => void;
    onDelete: () => void;

    tags?: string[];
    onChangeTags?: (tags: string[]) => void;
};

export function SingleEditorToolbar(props: SingleEditorToolbarProps) {
    const { tags = [], onChangeTags } = props;

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(tags.join(', '));

    const hasTags = tags.length > 0;

    function startEdit() {
        if (!onChangeTags) return;
        setDraft(tags.join(', '));
        setEditing(true);
    }

    function commit() {
        if (!onChangeTags) return;

        const next = draft
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        onChangeTags(next);
        setEditing(false);
    }

    function cancel() {
        setDraft(tags.join(', '));
        setEditing(false);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
    }

    return (
        <div className="set-wrap">
            {/* LEFT */}
            <div className="set-actions set-actions--left">
                <button type="button" className="set-btn set-btn--danger" onClick={props.onDelete}>
                    🗑 Delete
                </button>
            </div>

            {/* CENTER — TAGS */}
            {onChangeTags && (
                <div className="set-tags">
                    {!editing ? (
                        <div
                            className={`set-tags__view ${!hasTags ? 'is-empty' : ''}`}
                            role="button"
                            onClick={startEdit}
                        >
                            <span className="set-tags__label">Tags:</span>
                            <span className="set-tags__value">
                                {hasTags ? tags.join(', ') : 'Add tags…'}
                            </span>
                        </div>
                    ) : (
                        <input
                            className="set-tags__input"
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onKeyDown}
                            onBlur={commit}
                            placeholder="tag1, tag2, tag3"
                        />
                    )}
                </div>
            )}

            {/* RIGHT */}
            <div className="set-actions set-actions--right">
                <button type="button" className="set-btn set-btn--secondary" onClick={props.exit}>
                    ✖ Exit
                </button>

                <button
                    type="button"
                    className="set-btn set-btn--primary"
                    disabled={!props.canSave}
                    onClick={() => !props.saving && props.canSave && props.save()}
                    title={!props.canSave ? 'Saving...' : 'Save'}
                >
                    {!props.saving ? '💾 Save' : 'Saving…'}
                </button>
            </div>
        </div>
    );
}
