// features/admin/publicStream/ui/PublicStreamEditor.tsx

import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { usePublicStreamSession } from '../publicStreamSession/PublicStreamSession.context';
import './PublicStreamEditor.css';

export function PublicStreamEditor() {
    const session = usePublicStreamSession();
    const gCtx = useEditorWorkspace();
    const {
        publicStream,
        availableStreams,
        isLoading,
        isSaving,
        isDirty,
        selectedIds,
        addStream,
        removeStream,
        save,
        discard,
        exit,
        toggleSelection,
        selectAll,
        deselectAll,
        publishSelected,
        unpublishSelected,
    } = session;

    if (isLoading) {
        return (
            <div className="pse">
                <div className="pse__loading">Loading PublicStream...</div>
            </div>
        );
    }

    if (!publicStream) {
        return (
            <div className="pse">
                <div className="pse__loading">Failed to load PublicStream</div>
            </div>
        );
    }

    // Get streams that are in public stream (from FULL index, not filtered)
    const publicStreamIds = new Set(publicStream.streamIds);
    const allStreams = gCtx.streamsIndex || [];
    const publicStreams = allStreams.filter((s) => publicStreamIds.has(s.streamId));

    // Get streams that are NOT in public stream AND have valid status (available to add)
    const nonPublicStreams = availableStreams.filter((s) => !publicStreamIds.has(s.streamId));

    // Preserve order from publicStream.streamIds
    const orderedPublicStreams = publicStream.streamIds
        .map((id) => publicStreams.find((s) => s.streamId === id))
        .filter((s) => s !== undefined);

    const handlePreview = () => {
        window.open('/', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="pse">
            <div className="pse__header">
                <h1 className="pse__title">Public Stream</h1>
                <div className="pse__actions">
                    <button
                        className="pse__btn pse__btn--preview"
                        onClick={handlePreview}
                        title="View public site in new tab"
                    >
                        👁️ Preview
                    </button>
                    <button className="pse__btn pse__btn--secondary" onClick={exit}>
                        Exit
                    </button>
                    {isDirty && (
                        <button className="pse__btn pse__btn--secondary" onClick={discard}>
                            Discard
                        </button>
                    )}
                    <button
                        className="pse__btn pse__btn--primary"
                        onClick={() => void save()}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="pse__content">
                {/* Public Streams (current) */}
                <div className="pse__section">
                    <div className="pse__section-header">
                        <h2 className="pse__section-title">
                            Published Streams
                            <span className="pse__count">({orderedPublicStreams.length})</span>
                        </h2>
                        {orderedPublicStreams.length > 0 && (
                            <div className="pse__batch-controls">
                                {selectedIds.size > 0 && (
                                    <button
                                        className="pse__batch-btn pse__batch-btn--danger"
                                        onClick={unpublishSelected}
                                    >
                                        Unpublish Selected ({selectedIds.size})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="pse__list">
                        {orderedPublicStreams.length === 0 ? (
                            <div className="pse__empty">
                                No streams published yet. Add streams from the right panel.
                            </div>
                        ) : (
                            orderedPublicStreams.map((stream) => (
                                <div key={stream.streamId} className="pse__stream-item pse__stream-item--public">
                                    <input
                                        type="checkbox"
                                        className="pse__checkbox"
                                        checked={selectedIds.has(stream.streamId)}
                                        onChange={() => toggleSelection(stream.streamId)}
                                    />
                                    {stream.thumbnail && (
                                        <img
                                            src={stream.thumbnail}
                                            alt={stream.title}
                                            className="pse__stream-thumbnail"
                                        />
                                    )}
                                    <div className="pse__stream-info">
                                        <h3 className="pse__stream-title">{stream.title}</h3>
                                        <div className="pse__stream-meta">
                                            <span className="pse__badge pse__badge--public">PUBLIC</span>
                                            {' • '}
                                            {stream.status}
                                        </div>
                                    </div>
                                    <div className="pse__stream-actions">
                                        <button
                                            className="pse__icon-btn pse__icon-btn--danger"
                                            onClick={() => removeStream(stream.streamId)}
                                            title="Unpublish"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Available Streams (to add) */}
                <div className="pse__section">
                    <div className="pse__section-header">
                        <h2 className="pse__section-title">
                            Available Streams
                            <span className="pse__count">({nonPublicStreams.length})</span>
                        </h2>
                        {nonPublicStreams.length > 0 && (
                            <div className="pse__batch-controls">
                                <button
                                    className="pse__batch-btn"
                                    onClick={selectAll}
                                    disabled={selectedIds.size === availableStreams.length}
                                >
                                    Select All
                                </button>
                                <button
                                    className="pse__batch-btn"
                                    onClick={deselectAll}
                                    disabled={selectedIds.size === 0}
                                >
                                    Deselect
                                </button>
                                <span className="pse__selection-count">
                                    {selectedIds.size > 0 && `${selectedIds.size} selected`}
                                </span>
                                <button
                                    className="pse__batch-btn pse__batch-btn--action"
                                    onClick={publishSelected}
                                    disabled={selectedIds.size === 0}
                                >
                                    Publish Selected
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="pse__list">
                        {nonPublicStreams.length === 0 ? (
                            <div className="pse__empty">
                                All ready streams are already published.
                            </div>
                        ) : (
                            nonPublicStreams.map((stream) => (
                                <div key={stream.streamId} className="pse__stream-item">
                                    <input
                                        type="checkbox"
                                        className="pse__checkbox"
                                        checked={selectedIds.has(stream.streamId)}
                                        onChange={() => toggleSelection(stream.streamId)}
                                    />
                                    {stream.thumbnail && (
                                        <img
                                            src={stream.thumbnail}
                                            alt={stream.title}
                                            className="pse__stream-thumbnail"
                                        />
                                    )}
                                    <div className="pse__stream-info">
                                        <h3 className="pse__stream-title">{stream.title}</h3>
                                        <div className="pse__stream-meta">{stream.status}</div>
                                    </div>
                                    <div className="pse__stream-actions">
                                        <button
                                            className="pse__icon-btn"
                                            onClick={() => addStream(stream.streamId)}
                                            title="Publish"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
