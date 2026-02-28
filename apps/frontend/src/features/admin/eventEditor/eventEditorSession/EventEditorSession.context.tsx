// features/admin/eventEditor/eventEditorSession/EventEditorSession.context.tsx

import type { EventData, EventStatus } from '@/entities/event';
import type { Localized, Money } from '@/entities/common';
import { useRefreshEvents } from '@/shared/EventsProvider/EventsProvider';
import {
    useArrival,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { slugify } from '@/shared/lib/text/slugify';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { eventsAdminApi, type CreateEventPayload } from '../api/eventsAdminApi';

type ScreenMode = 'list' | 'edit' | 'create' | 'select';

export interface EventDraft {
  id?: string;
  slug: string;
  titleEn: string;
  description: string;
  dateTime: string;
  durationMinutes: string;
  location: string;
  mapUrl: string;
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
  mapUrl: '',
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
    mapUrl: e.mapUrl ?? '',
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
    mapUrl: draft.mapUrl || undefined,
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
  onTitleChange: (value: string) => void;
  selectEvent: (id: string) => void;
  createNew: () => void;
  save: () => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  back: () => void;
  refreshEvents: () => Promise<void>;
  isJourney: boolean;
  selectAndReturn: (eventId: string) => void;
  cancelSelect: () => void;
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

  // Journey hooks
  const arrival = useArrival();
  const returnHome = useReturnHome();
  const isJourney = useJourneyStatus('events');

  // React Strict Mode protection for bootstrap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bootstrapRef = useRef<{ processed: boolean; ticket: any }>({
    processed: false,
    ticket: null,
  });

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

  // Bootstrap: check for journey ticket on mount
  useEffect(() => {
    if (bootstrapRef.current.processed) return;

    const ticket = arrival('events');
    bootstrapRef.current = { processed: true, ticket };

    void (async () => {
      await loadEvents();

      if (!ticket) {
        setScreenMode('list');
        return;
      }

      if (!ticket.loot) {
        // Outbound: block editor wants us to select an event
        switch (ticket.destination.mode) {
          case 'select':
            setScreenMode('select');
            return;
          case 'edit': {
            const id = ticket.destination.objectId;
            if (!id) throw new Error('[Events BOOTSTRAP]: outbound edit missing objectId');
            const catalog = await eventsAdminApi.getAll();
            const found = Object.values(catalog.events).find((e) => e.id === id);
            if (found) {
              setDraft(eventToFormDraft(found));
              setScreenMode('edit');
            }
            return;
          }
        }
      }
      // Events editor is always a leaf — no return handling needed
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onTitleChange = useCallback(
    (value: string) => {
      setDraft((prev) => {
        const next = { ...prev, titleEn: value };
        if (screenMode === 'create') {
          next.slug = slugify(value);
        }
        return next;
      });
    },
    [screenMode],
  );

  const selectAndReturn = useCallback(
    (eventId: string) => {
      if (!isJourney) return;
      returnHome('events', { ok: true, id: eventId });
    },
    [isJourney, returnHome],
  );

  const cancelSelect = useCallback(() => {
    if (!isJourney) return;
    returnHome('events', { ok: false, reason: 'cancel' });
  }, [isJourney, returnHome]);

  const session: EventEditorSession = {
    events,
    screenMode,
    draft,
    isLoading,
    isSaving,
    setDraftField,
    onTitleChange,
    selectEvent,
    createNew,
    save,
    deleteEvent,
    back,
    refreshEvents: loadEvents,
    isJourney,
    selectAndReturn,
    cancelSelect,
  };

  return (
    <EventEditorSessionContext.Provider value={session}>
      {children}
    </EventEditorSessionContext.Provider>
  );
}
