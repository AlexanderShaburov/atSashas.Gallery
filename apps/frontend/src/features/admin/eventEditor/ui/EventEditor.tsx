// features/admin/eventEditor/ui/EventEditor.tsx

import type { EventStatus } from '@/entities/event';
import { EVENT_STATUSES } from '@/entities/event';
import { CURRENCIES } from '@/entities/common/money';
import { useEventEditorSession } from '../eventEditorSession/EventEditorSession.context';
import './EventEditor.css';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function EventSelectList() {
  const { events, isLoading, selectAndReturn, cancelSelect } = useEventEditorSession();

  if (isLoading) {
    return <div className="eve__loading">Loading events...</div>;
  }

  return (
    <>
      <div className="eve__header">
        <h1 className="eve__title">Select Event</h1>
        <div className="eve__actions">
          <button className="eve__btn eve__btn--secondary" onClick={cancelSelect}>
            Cancel
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="eve__empty">No events available.</div>
      ) : (
        <div className="eve__list">
          {events.map((ev) => (
            <div key={ev.id} className="eve__item" onClick={() => selectAndReturn(ev.id)}>
              <div className="eve__item-info">
                <h3 className="eve__item-title">{ev.title.en || ev.id}</h3>
                <div className="eve__item-meta">
                  {ev.dateTime && new Date(ev.dateTime).toLocaleDateString()}
                  {ev.location && ` \u2022 ${ev.location}`}
                </div>
              </div>
              <span className={`eve__badge eve__badge--${ev.status}`}>{ev.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EventList() {
  const { events, isLoading, selectEvent, createNew } = useEventEditorSession();

  if (isLoading) {
    return <div className="eve__loading">Loading events...</div>;
  }

  return (
    <>
      <div className="eve__header">
        <h1 className="eve__title">Events</h1>
        <div className="eve__actions">
          <button className="eve__btn eve__btn--primary" onClick={createNew}>
            New Event
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="eve__empty">No events yet. Create one to get started.</div>
      ) : (
        <div className="eve__list">
          {events.map((ev) => (
            <div key={ev.id} className="eve__item" onClick={() => selectEvent(ev.id)}>
              <div className="eve__item-info">
                <h3 className="eve__item-title">{ev.title.en || ev.id}</h3>
                <div className="eve__item-meta">
                  {ev.dateTime && new Date(ev.dateTime).toLocaleDateString()}
                  {ev.location && ` \u2022 ${ev.location}`}
                </div>
              </div>
              <span className={`eve__badge eve__badge--${ev.status}`}>{ev.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EnrollmentsList({ eventId }: { eventId: string }) {
  const { events } = useEventEditorSession();
  const event = events.find((e) => e.id === eventId);
  const enrollments = event?.enrollments ? Object.values(event.enrollments) : [];

  if (enrollments.length === 0) {
    return (
      <div className="eve__enrollments">
        <h3 className="eve__enrollments-title">Enrollments (0)</h3>
        <div className="eve__empty" style={{ padding: '1rem' }}>
          No enrollments yet.
        </div>
      </div>
    );
  }

  return (
    <div className="eve__enrollments">
      <h3 className="eve__enrollments-title">Enrollments ({enrollments.length})</h3>
      <table className="eve__enrollments-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((en) => (
            <tr key={en.id}>
              <td>{en.fullName}</td>
              <td>{en.email}</td>
              <td>{new Date(en.createdAt).toLocaleDateString()}</td>
              <td>
                <span className={`eve__badge eve__badge--${en.paymentStatus}`}>
                  {en.paymentStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventForm() {
  const { screenMode, draft, isSaving, setDraftField, save, deleteEvent, back } =
    useEventEditorSession();

  const isEdit = screenMode === 'edit';
  const heading = isEdit ? 'Edit Event' : 'New Event';

  const handleTitleChange = (value: string) => {
    setDraftField('titleEn', value);
    if (!isEdit) {
      setDraftField('slug', slugify(value));
    }
  };

  return (
    <>
      <div className="eve__header">
        <h1 className="eve__title">{heading}</h1>
      </div>

      <div className="eve__form">
        <div className="eve__field">
          <label>Title</label>
          <input
            type="text"
            value={draft.titleEn}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Event title"
          />
        </div>

        <div className="eve__field">
          <label>Slug</label>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => setDraftField('slug', e.target.value)}
            placeholder="event-slug"
          />
        </div>

        <div className="eve__row">
          <div className="eve__field">
            <label>Date / Time</label>
            <input
              type="datetime-local"
              value={draft.dateTime ? draft.dateTime.slice(0, 16) : ''}
              onChange={(e) => setDraftField('dateTime', e.target.value)}
            />
          </div>
          <div className="eve__field">
            <label>Duration (min)</label>
            <input
              type="number"
              min={0}
              value={draft.durationMinutes}
              onChange={(e) => setDraftField('durationMinutes', e.target.value)}
              placeholder="90"
            />
          </div>
        </div>

        <div className="eve__field">
          <label>Location</label>
          <input
            type="text"
            value={draft.location}
            onChange={(e) => setDraftField('location', e.target.value)}
            placeholder="Gallery address"
          />
        </div>

        <div className="eve__field">
          <label>Map URL</label>
          <input
            type="url"
            value={draft.mapUrl}
            onChange={(e) => setDraftField('mapUrl', e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div className="eve__row">
          <div className="eve__field">
            <label>Price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.priceAmount}
              onChange={(e) => setDraftField('priceAmount', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="eve__field">
            <label>Currency</label>
            <select
              value={draft.priceCurrency}
              onChange={(e) => setDraftField('priceCurrency', e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="eve__field">
          <label>Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraftField('description', e.target.value)}
            placeholder="Event description"
          />
        </div>

        <div className="eve__field">
          <label>Status</label>
          <select
            value={draft.status}
            onChange={(e) => setDraftField('status', e.target.value as EventStatus)}
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="eve__toolbar">
          <button className="eve__btn eve__btn--secondary" onClick={back}>
            Back
          </button>
          <button
            className="eve__btn eve__btn--primary"
            onClick={() => void save()}
            disabled={isSaving || !draft.titleEn || !draft.slug}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {isEdit && draft.id && (
            <button
              className="eve__btn eve__btn--danger"
              onClick={() => void deleteEvent(draft.id!)}
              disabled={isSaving}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {isEdit && draft.id && <EnrollmentsList eventId={draft.id} />}
    </>
  );
}

export function EventEditor() {
  const { screenMode } = useEventEditorSession();

  return (
    <div className="eve">
      {screenMode === 'select' ? (
        <EventSelectList />
      ) : screenMode === 'list' ? (
        <EventList />
      ) : (
        <EventForm />
      )}
    </div>
  );
}
