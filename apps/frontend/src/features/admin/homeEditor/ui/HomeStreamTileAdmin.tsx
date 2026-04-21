// features/admin/homeEditor/ui/HomeStreamTileAdmin.tsx
//
// Admin tile for a streamRef item. Wraps the stream's visual with a
// command overlay (drag handle, Open, Remove). Does not navigate on
// body click — opening goes through the Journey dispatcher owned by
// the session. Unresolved references render as an orphan state.

import type { HomeStreamRef } from '@/entities/homeDoc';
import type { StreamIndexItem } from '@/entities/stream';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
    dndId: string;
    item: HomeStreamRef;
    index: number;
    resolved: StreamIndexItem | undefined;
    onOpen: (index: number) => void;
    onRemove: (index: number) => void;
};

export function HomeStreamTileAdmin({ dndId, item, index, resolved, onOpen, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: dndId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const title = resolved?.title ?? item.streamId;
    const thumbnail = item.thumbOverrideUrl ?? resolved?.thumbnail;
    const isOrphan = !resolved;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`hea-tile hea-tile--stream ${isOrphan ? 'hea-tile--orphan' : ''}`}
        >
            <button
                type="button"
                className="hea-tile__drag"
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>
            <div className="hea-tile__body">
                {thumbnail ? (
                    <img src={thumbnail} alt={title} className="hea-tile__thumb" />
                ) : (
                    <div className="hea-tile__thumb hea-tile__thumb--empty" aria-hidden="true" />
                )}
                <div className="hea-tile__text">
                    <span className="hea-tile__badge hea-tile__badge--stream">Stream</span>
                    <h3 className="hea-tile__title">
                        {isOrphan ? `Missing — ${item.streamId}` : title}
                    </h3>
                </div>
            </div>
            <div className="hea-tile__actions">
                {!isOrphan && (
                    <button
                        type="button"
                        className="hea-tile__btn"
                        onClick={() => onOpen(index)}
                    >
                        Open
                    </button>
                )}
                <button
                    type="button"
                    className="hea-tile__btn hea-tile__btn--danger"
                    onClick={() => onRemove(index)}
                >
                    Remove
                </button>
            </div>
        </div>
    );
}
