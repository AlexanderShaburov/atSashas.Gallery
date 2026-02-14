// features/public/ui/EventCta/EventCtaView.tsx

import type { EventCtaBlock } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';
import './EventCtaView.css';

type Props = { block: EventCtaBlock };

export default function EventCtaView({ block }: Props) {
    const event = useEvent(block.eventId);

    if (!event) {
        return (
            <div className="event-cta event-cta--missing">
                <span>Event not found</span>
            </div>
        );
    }

    const isClosed = event.status === 'closed';
    const isDraft = event.status === 'draft';
    const dateStr = new Date(event.dateTime).toLocaleDateString();
    const buttonText = block.buttonLabel?.en ?? 'Learn more';

    return (
        <div className={`event-cta event-cta--${event.status}`}>
            {isDraft && <span className="event-cta__badge">Draft</span>}
            <h3 className="event-cta__title">{event.title.en}</h3>
            <div className="event-cta__meta">
                <span className="event-cta__date">{dateStr}</span>
                {event.location && <span className="event-cta__location">{event.location}</span>}
                {event.price && (
                    <span className="event-cta__price">
                        {event.price.amount} {event.price.currency}
                    </span>
                )}
            </div>
            {event.description?.en && (
                <p className="event-cta__description">{event.description.en}</p>
            )}
            <button className="event-cta__button" disabled={isClosed || isDraft}>
                {isClosed ? 'Registration closed' : buttonText}
            </button>
        </div>
    );
}
