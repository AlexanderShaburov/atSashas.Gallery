// features/admin/homeEditor/ui/HomeEventTileAdmin.tsx
//
// Admin tile for an eventRef item. Resolves the EventPageData by
// EventPageData.id (never via legacy eventId). Renders a minimal
// text-only summary identical to the public v1 HomeEventTile, plus
// a command overlay. Orphan state is a tile with Remove only.

import type { EventPageData } from '@/entities/event';
import type { HomeEventRef } from '@/entities/homeDoc';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
    dndId: string;
    item: HomeEventRef;
    index: number;
    resolved: EventPageData | undefined;
    onOpen: (index: number) => void;
    onRemove: (index: number) => void;
};

function formatDate(iso: string | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
}

export function HomeEventTileAdmin({ dndId, item, index, resolved, onOpen, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: dndId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isOrphan = !resolved;
    const title = resolved?.title?.en ?? resolved?.id ?? item.eventPageId;
    const preset = resolved?.preset;
    const dateStart =
        resolved && 'dateStart' in resolved
            ? (resolved as { dateStart?: string }).dateStart
            : undefined;
    const formattedDate = formatDate(dateStart);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`hea-tile hea-tile--event ${isOrphan ? 'hea-tile--orphan' : ''}`}
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
                <div className="hea-tile__text">
                    <span className="hea-tile__badge hea-tile__badge--event">
                        {preset ?? 'Event'}
                    </span>
                    <h3 className="hea-tile__title">
                        {isOrphan ? `Missing — ${item.eventPageId}` : title}
                    </h3>
                    {formattedDate && (
                        <p className="hea-tile__meta">{formattedDate}</p>
                    )}
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
