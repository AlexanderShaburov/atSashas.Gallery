// features/admin/homeEditor/ui/OrphanTileAdmin.tsx
//
// Admin tile for a HomeDoc item whose reference does not resolve
// (streamId or eventPageId not in the respective catalog). Shows a
// warning-styled tile with "Missing — <id>" and Remove only, per the
// plan's §6 orphan handling.

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
    dndId: string;
    kind: 'stream' | 'event';
    missingId: string;
    index: number;
    onRemove: (index: number) => void;
};

export function OrphanTileAdmin({ dndId, kind, missingId, index, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: dndId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="hea-tile hea-tile--orphan">
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
                    <span className="hea-tile__badge hea-tile__badge--orphan">
                        Missing {kind}
                    </span>
                    <h3 className="hea-tile__title">Missing — {missingId}</h3>
                    <p className="hea-tile__meta">
                        The referenced {kind === 'event' ? 'event page' : 'stream'} could not be resolved. Remove this tile to clean up the homepage.
                    </p>
                </div>
            </div>
            <div className="hea-tile__actions">
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
