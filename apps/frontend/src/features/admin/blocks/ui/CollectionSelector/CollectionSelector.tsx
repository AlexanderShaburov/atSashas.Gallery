// src/features/admin/blocks/BlockEditor/CollectionSelector.tsx

import type { CollectionsList } from '@/entities/block';
import { useState } from 'react';

import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession/blockEditorTypes';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';

import './CollectionSelector.css';

type Props = {
    collections: CollectionsList | undefined;
    selectedId: string | undefined | null;
    loading: boolean;
};

export function CollectionSelector({ collections, selectedId, loading }: Props) {
    const session = useBlockEditorSession() as BlockEditorSession;

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const handleChange: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
        const value = e.target.value || null;
        if (!value) return;

        const c = await getCollection(value);
        console.log(
            `[HandleChangeCollection]: new collection received with name: "${c?.collectionName}"`,
        );
        console.dir(c);

        session.setCollection(c);
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;

        setCreateLoading(true);
        try {
            await session.newCollection(name);

            setNewName('');
            setIsCreating(false);
        } finally {
            setCreateLoading(false);
        }
    };

    const disabledSelect = loading || !collections || collections.length === 0;

    // ---------- CREATE MODE: большой input + OK / ✕ ----------
    if (isCreating) {
        return (
            <div className="collection-selector collection-selector--creating">
                <div className="collection-selector__inline">
                    <input
                        className="collection-selector__name-input"
                        placeholder="New collection name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                    />

                    <button
                        type="button"
                        className="collection-selector__action-btn collection-selector__action-btn--ok"
                        onClick={handleCreate}
                        disabled={!newName.trim() || createLoading}
                        title="Create collection"
                    >
                        OK
                    </button>

                    <button
                        type="button"
                        className="collection-selector__action-btn collection-selector__action-btn--cancel"
                        onClick={() => {
                            setIsCreating(false);
                            setNewName('');
                        }}
                        title="Cancel"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    // ---------- NORMAL MODE: Collection + select + '+' ----------
    return (
        <div className="collection-selector">
            <label className="collection-selector__label">
                <span className="collection-selector__label-text">Collection</span>
                <select
                    className="collection-selector__select"
                    value={selectedId ?? ''}
                    onChange={handleChange}
                    disabled={disabledSelect}
                >
                    <option value="">— choose —</option>
                    {collections?.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </label>

            <button
                type="button"
                className="collection-selector__add-btn"
                onClick={() => setIsCreating(true)}
                disabled={loading}
                title="Create collection"
            >
                +
            </button>
        </div>
    );
}
