// src/shared/ui/SingleEditorToolbar/ToolbarElements.tsx

import { useState } from 'react';

export function AddBlockButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="set-btn" onClick={onClick}>
            Add
        </button>
    );
}
export function EditMetadata({ onEdit }: { onEdit: () => void }) {
    return (
        <button type="button" className="set-btn" onClick={onEdit}>
            Edit Meta
        </button>
    );
}
export function ApplyButton({ onApply }: { onApply: () => void }) {
    return (
        <button type="button" className="set-btn" onClick={onApply}>
            Apply
        </button>
    );
}
export function DeleteButton({ onDelete }: { onDelete: () => void }) {
    return (
        <button type="button" className="set-btn set-btn--danger" onClick={onDelete}>
            Delete
        </button>
    );
}

export function PublishButton({ onPublish }: { onPublish: () => void }) {
    return (
        <button type="button" className="set-btn set-btn--success" onClick={onPublish}>
            Publish
        </button>
    );
}

export function UnpublishButton({ onUnpublish }: { onUnpublish: () => void }) {
    return (
        <button type="button" className="set-btn set-btn--warning" onClick={onUnpublish}>
            Unpublish
        </button>
    );
}
export function ExitButton({ onExit }: { onExit: () => void }) {
    return (
        <button type="button" className="set-btn" onClick={onExit}>
            Exit
        </button>
    );
}
export function SaveButton({
    onClick,
    canSave,
    saving,
}: {
    onClick: () => void;
    canSave: boolean;
    saving: boolean;
}) {
    return (
        <button
            type="button"
            className="set-btn set-btn--primary"
            disabled={!canSave}
            onClick={() => !saving && canSave && onClick()}
            title={saving ? 'Saving...' : 'Save'}
        >
            {!saving ? 'Save' : 'Saving\u2026'}
        </button>
    );
}
export function TagsEditor({
    onCommit,
    tags,
}: {
    onCommit: (tags: string[]) => void;
    tags: string[];
}) {
    const trueTags = tags ? tags : [];

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(trueTags.join(', '));

    const hasTags = trueTags.length > 0;

    function startEdit() {
        if (!onCommit) return;
        setDraft(trueTags.join(', '));
        setEditing(true);
    }

    function commit() {
        if (!onCommit) return;

        const next = draft
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        onCommit(next);
        setEditing(false);
    }

    function cancel() {
        setDraft(trueTags.join(', '));
        setEditing(false);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
    }
    return (
        <div className="set-tags">
            {!editing ? (
                <div
                    className={`set-tags__view ${!hasTags ? 'is-empty' : ''}`}
                    role="button"
                    onClick={startEdit}
                >
                    <span className="set-tags__label">Tags:</span>
                    <span className="set-tags__value">
                        {hasTags ? trueTags.join(', ') : 'Add tags\u2026'}
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
    );
}
