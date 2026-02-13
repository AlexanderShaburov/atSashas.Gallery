// features/admin/publicStream/ui/PublicStreamEditor.tsx

import { usePublicStreamSession } from '../publicStreamSession/PublicStreamSession.context';
import './PublicStreamEditor.css';

export function PublicStreamEditor() {
    const session = usePublicStreamSession();
    const {
        publicStream,
        availableStreams,
        isLoading,
        isSaving,
        isDirty,
        addStream,
        removeStream,
        save,
        discard,
        exit,
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

    // Get streams that are in public stream
    const publicStreamIds = new Set(publicStream.streamIds);
    const publicStreams = availableStreams.filter((s) => publicStreamIds.has(s.streamId));

    // Get streams that are NOT in public stream (available to add)
    const nonPublicStreams = availableStreams.filter((s) => !publicStreamIds.has(s.streamId));

    // Preserve order from publicStream.streamIds
    const orderedPublicStreams = publicStream.streamIds
        .map((id) => publicStreams.find((s) => s.streamId === id))
        .filter((s) => s !== undefined);

    return (
        <div className="pse">
            <div className="pse__header">
                <h1 className="pse__title">Public Stream</h1>
                <div className="pse__actions">
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
                    <h2 className="pse__section-title">
                        Published Streams
                        <span className="pse__count">({orderedPublicStreams.length})</span>
                    </h2>
                    <div className="pse__list">
                        {orderedPublicStreams.length === 0 ? (
                            <div className="pse__empty">
                                No streams published yet. Add streams from the right panel.
                            </div>
                        ) : (
                            orderedPublicStreams.map((stream) => (
                                <div key={stream.streamId} className="pse__stream-item pse__stream-item--public">
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
                    <h2 className="pse__section-title">
                        Available Streams
                        <span className="pse__count">({nonPublicStreams.length})</span>
                    </h2>
                    <div className="pse__list">
                        {nonPublicStreams.length === 0 ? (
                            <div className="pse__empty">
                                All ready streams are already published.
                            </div>
                        ) : (
                            nonPublicStreams.map((stream) => (
                                <div key={stream.streamId} className="pse__stream-item">
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
