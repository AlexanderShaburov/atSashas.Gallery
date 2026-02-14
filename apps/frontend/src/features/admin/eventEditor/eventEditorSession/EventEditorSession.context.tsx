// features/admin/eventEditor/eventEditorSession/EventEditorSession.context.tsx

import type { EventData, EventStatus } from '@/entities/event';
import type { Localized, Money } from '@/entities/common';
import { useRefreshEvents } from '@/shared/EventsProvider/EventsProvider';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { eventsAdminApi, type CreateEventPayload } from '../api/eventsAdminApi';

type ScreenMode = 'list' | 'edit' | 'create';

export interface EventDraft {
  id?: string;
  slug: string;
  titleEn: string;
  description: string;
  dateTime: string;
  durationMinutes: string;
  location: string;
  priceAmount: string;
  priceCurrency: string;
  status: EventStatus;
  streamSlug: string;
}

const EMPTY_DRAFT: EventDraft = {
  slug: '',
  titleEn: '',
  description: '',
  dateTime: '',
  durationMinutes: '',
  location: '',
  priceAmount: '',
  priceCurrency: 'EUR',
  status: 'draft',
  streamSlug: '',
};

function eventToFormDraft(e: EventData): EventDraft {
  return {
    id: e.id,
    slug: e.slug,
    titleEn: e.title.en ?? '',
    description: e.description?.en ?? '',
    dateTime: e.dateTime,
    durationMinutes: e.durationMinutes?.toString() ?? '',
    location: e.location,
    priceAmount: e.price?.amount?.toString() ?? '',
    priceCurrency: e.price?.currency ?? 'EUR',
    status: e.status,
    streamSlug: e.streamSlug ?? '',
  };
}

function formDraftToPayload(draft: EventDraft): CreateEventPayload {
  const title: Localized = { en: draft.titleEn };
  const description: Localized | undefined = draft.description ? { en: draft.description } : undefined;
  const price: Money | undefined =
    draft.priceAmount && Number(draft.priceAmount) > 0
      ? { amount: Number(draft.priceAmount), currency: draft.priceCurrency as Money['currency'] }
      : undefined;
  const durationMinutes =
    draft.durationMinutes && Number(draft.durationMinutes) > 0
      ? Number(draft.durationMinutes)
      : undefined;

  return {
    slug: draft.slug,
    title,
    description,
    dateTime: draft.dateTime,
    durationMinutes,
    location: draft.location,
    price,
    status: draft.status,
    streamSlug: draft.streamSlug || undefined,
  };
}

export interface EventEditorSession {
  events: EventData[];
  screenMode: ScreenMode;
  draft: EventDraft;
  isLoading: boolean;
  isSaving: boolean;

  setDraftField: <K extends keyof EventDraft>(field: K, value: EventDraft[K]) => void;
  selectEvent: (id: string) => void;
  createNew: () => void;
  save: () => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  back: () => void;
  refreshEvents: () => Promise<void>;
}

const EventEditorSessionContext = createContext<EventEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useEventEditorSession(): EventEditorSession {
  const ctx = useContext(EventEditorSessionContext);
  if (!ctx) throw new Error('useEventEditorSession must be used within EventEditorSessionProvider');
  return ctx;
}

export function EventEditorSessionProvider({ children }: { children: React.ReactNode }) {
  const refreshGlobalEvents = useRefreshEvents();
  const [events, setEvents] = useState<EventData[]>([]);
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [draft, setDraft] = useState<EventDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const catalog = await eventsAdminApi.getAll();
      setEvents(Object.values(catalog.events));
    } catch (err) {
      console.error('[EventEditorSession] Failed to load events', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const selectEvent = useCallback(
    (id: string) => {
      const found = events.find((e) => e.id === id);
      if (!found) return;
      setDraft(eventToFormDraft(found));
      setScreenMode('edit');
    },
    [events],
  );

  const createNew = useCallback(() => {
    setDraft({ ...EMPTY_DRAFT });
    setScreenMode('create');
  }, []);

  const back = useCallback(() => {
    setScreenMode('list');
    setDraft(EMPTY_DRAFT);
  }, []);

  const save = useCallback(async () => {
    try {
      setIsSaving(true);
      if (screenMode === 'create') {
        const payload = formDraftToPayload(draft);
        await eventsAdminApi.create(payload);
      } else if (screenMode === 'edit' && draft.id) {
        const payload = formDraftToPayload(draft);
        const full: EventData = { id: draft.id, ...payload };
        await eventsAdminApi.update(draft.id, full);
      }
      await loadEvents();
      void refreshGlobalEvents();
      setScreenMode('list');
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      console.error('[EventEditorSession] Save failed', err);
      alert(`Failed to save event: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [screenMode, draft, loadEvents, refreshGlobalEvents]);

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!confirm('Delete this event?')) return;
      try {
        setIsSaving(true);
        await eventsAdminApi.remove(id);
        await loadEvents();
        void refreshGlobalEvents();
        setScreenMode('list');
        setDraft(EMPTY_DRAFT);
      } catch (err) {
        console.error('[EventEditorSession] Delete failed', err);
        alert(`Failed to delete event: ${err}`);
      } finally {
        setIsSaving(false);
      }
    },
    [loadEvents, refreshGlobalEvents],
  );

  const setDraftField = useCallback(
    <K extends keyof EventDraft>(field: K, value: EventDraft[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const session: EventEditorSession = {
    events,
    screenMode,
    draft,
    isLoading,
    isSaving,
    setDraftField,
    selectEvent,
    createNew,
    save,
    deleteEvent,
    back,
    refreshEvents: loadEvents,
  };

  return (
    <EventEditorSessionContext.Provider value={session}>
      {children}
    </EventEditorSessionContext.Provider>
  );
}
