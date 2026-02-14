// features/admin/shared/ui/BlockPreview/EventCtaBlockComponent.tsx

import type { Block, BlockParent, EventCtaBlock } from '@/entities/block';
import '@/features/admin/blocks/ui/BlockTemplates/block.templates.css';
import { BlockHitEvent, Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { useEvent } from '@/shared/EventsProvider/useEvent';

type Props = {
    item: EventCtaBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    setValue: (next: Block) => void;
    readOnly?: boolean;
};

export function EventCtaBlockComponent({ item, onHit }: Props) {
    const event = useEvent(item.eventId);

    return (
        <div
            role="button"
            className="blk-cta blk-cta-event"
            onClick={(e) =>
                onHit({
                    block: item,
                    hit: Hit.eventCtaButton(),
                    nativeEvent: e,
                })
            }
        >
            {event ? (
                <>
                    <div className="blk-event-title">{event.title.en}</div>
                    <div className="blk-event-status">{event.status}</div>
                </>
            ) : (
                <div className="blk-event-missing">
                    {item.eventId ? `Event: ${item.eventId}` : 'No event selected'}
                </div>
            )}
        </div>
    );
}
