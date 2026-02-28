// features/admin/shared/ui/BlockPreview/EventCtaBlockComponent.tsx

import { type Block, type BlockHitEvent, type BlockParent, type EventCtaBlock, Hit } from '@/entities/block';
import '@/features/admin/blocks/ui/BlockTemplates/block.templates.css';
import { EventPicker } from '@/features/admin/blocks/ui/EventPicker/EventPicker';
import { useEvent } from '@/shared/EventsProvider/useEvent';

type Props = {
    item: EventCtaBlock;
    onHit: (hit: BlockHitEvent) => void;
    parent: BlockParent;
    setValue: (next: Block) => void;
    readOnly?: boolean;
};

export function EventCtaBlockComponent({ item, onHit, parent, setValue }: Props) {
    const event = useEvent(item.eventId);

    return (
        <div className="blk-cta blk-cta-event">
            <div
                role="button"
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
            {parent === 'editor' && <EventPicker item={item} setValue={setValue} />}
        </div>
    );
}
