// features/admin/publicStream/ui/PublicStreamEditor.tsx

import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { usePublicStreamSession } from '../publicStreamSession/PublicStreamSession.context';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PublicStreamEditor.css';
import { StreamIndexItem } from '@/entities/stream';

// Sortable stream item component
function SortableStreamItem({
    stream,
    onRemove,
    onToggleSelection,
    isSelected,
}: {
    stream: StreamIndexItem;
    onRemove: (id: string) => void;
    onToggleSelection: (id: string) => void;
    isSelected: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: stream.streamId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="pse__stream-item pse__stream-item--public pse__stream-item--draggable"
        >
            <div className="pse__drag-handle" {...attributes} {...listeners}>
                ⋮⋮
            </div>
            <input
                type="checkbox"
                className="pse__checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(stream.streamId)}
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
                    onClick={() => onRemove(stream.streamId)}
                    title="Unpublish"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

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
        reorderStreams,
        save,
        discard,
        exit,
        toggleSelection,
        selectAll,
        deselectAll,
        publishSelected,
        unpublishSelected,
    } = session;

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = publicStream?.streamIds.indexOf(active.id as string) ?? -1;
            const newIndex = publicStream?.streamIds.indexOf(over.id as string) ?? -1;

            if (oldIndex !== -1 && newIndex !== -1 && publicStream) {
                const newOrder = arrayMove(publicStream.streamIds, oldIndex, newIndex);
                reorderStreams(newOrder);
            }
        }
    };

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
        // Save draft stream IDs to localStorage for the preview page to read.
        // Only IDs are stored (always available), not full StreamIndexItem[]
        // which would depend on gCtx.streamsIndex being loaded.
        const draftIds = publicStream?.streamIds ?? [];
        localStorage.setItem('__preview_stream_ids', JSON.stringify(draftIds));
        window.open('/preview', '_blank', 'noopener,noreferrer');
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
                        Preview
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
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="pse__list">
                            {orderedPublicStreams.length === 0 ? (
                                <div className="pse__empty">
                                    No streams published yet. Add streams from the right panel.
                                </div>
                            ) : (
                                <SortableContext
                                    items={orderedPublicStreams.map((s) => s.streamId)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {orderedPublicStreams.map((stream) => (
                                        <SortableStreamItem
                                            key={stream.streamId}
                                            stream={stream}
                                            onRemove={removeStream}
                                            onToggleSelection={toggleSelection}
                                            isSelected={selectedIds.has(stream.streamId)}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </div>
                    </DndContext>
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
                                <label className="pse__select-all">
                                    <input
                                        type="checkbox"
                                        className="pse__checkbox"
                                        checked={
                                            selectedIds.size > 0 &&
                                            selectedIds.size >= nonPublicStreams.length
                                        }
                                        ref={(el) => {
                                            if (el) {
                                                el.indeterminate =
                                                    selectedIds.size > 0 &&
                                                    selectedIds.size < nonPublicStreams.length;
                                            }
                                        }}
                                        onChange={() =>
                                            selectedIds.size >= nonPublicStreams.length
                                                ? deselectAll()
                                                : selectAll()
                                        }
                                    />
                                    Select all
                                </label>
                                <button
                                    className="pse__batch-btn pse__batch-btn--action"
                                    onClick={publishSelected}
                                    disabled={selectedIds.size === 0}
                                >
                                    Publish selected
                                    {selectedIds.size > 0 && ` (${selectedIds.size})`}
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
