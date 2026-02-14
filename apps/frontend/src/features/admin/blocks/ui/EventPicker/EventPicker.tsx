// features/admin/blocks/ui/EventPicker/EventPicker.tsx

import type { Block, EventCtaBlock } from '@/entities/block';
import { useContext, useMemo } from 'react';
import { EventsContext } from '@/shared/EventsProvider/EventsProvider';
import './EventPicker.css';

type Props = {
  item: EventCtaBlock;
  setValue: (next: Block) => void;
};

export function EventPicker({ item, setValue }: Props) {
  const catalog = useContext(EventsContext);

  const events = useMemo(
    () => (catalog ? Object.values(catalog.events) : []),
    [catalog],
  );

  const handleChange = (eventId: string) => {
    setValue({ ...item, eventId });
  };

  return (
    <div className="event-picker">
      <span className="event-picker__label">Event</span>
      <select
        className="event-picker__select"
        value={item.eventId || ''}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">Select an event...</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title.en || ev.id} ({ev.status})
          </option>
        ))}
      </select>
    </div>
  );
}
