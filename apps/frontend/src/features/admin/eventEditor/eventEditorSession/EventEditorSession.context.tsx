// features/admin/eventEditor/eventEditorSession/EventEditorSession.context.tsx

import type { EventData, EventStatus } from '@/entities/event';
import type { Localized, Money } from '@/entities/common';
import type { EditorKey } from '@/shared/nav';
import { invalidateEventsCache } from '@/shared/EventsProvider/eventsApi';
import { editSessionsDataStore, eventsStore, useSessionDataStore, useStoreData } from '@/shared/state';
import {
    useArrival,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { slugify } from '@/shared/lib/text/slugify';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { eventsAdminApi, refreshEvents, type CreateEventPayload } from '../api/eventsAdminApi';

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

function makeEditorKey(id: string | null): EditorKey | undefined {
  if (!id) return undefined;
  return { kind: 'events', id };
}

export function EventEditorSessionProvider({ children }: { children: React.ReactNode }) {
  // ── External store: events list ──
  const catalog = useStoreData(eventsStore);
  const events = useMemo(() => (catalog ? Object.values(catalog.events) : []), [catalog]);

  // ── External store: editor draft ──
  const [editorKeyId, setEditorKeyId] = useState<string | null>(null);
  const editorKey = useMemo(() => makeEditorKey(editorKeyId), [editorKeyId]);
  const { storeData, setDraft: setStoreDraft, clear: clearSession } = useSessionDataStore<EventDraft>(editorKey);
  const draft = storeData?.draft ?? EMPTY_DRAFT;

  // ── Transient UI state (stays in Context — per ADR-003) ──
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Journey hooks ──
  const arrival = useArrival();
  const returnHome = useReturnHome();
  const isJourney = useJourneyStatus('events');

  // ── React Strict Mode protection for bootstrap ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bootstrapRef = useRef<{ processed: boolean; ticket: any }>({
    processed: false,
    ticket: null,
  });

  // Track editorKey for cleanup on unmount
  const editorKeyRef = useRef(editorKey);
  editorKeyRef.current = editorKey;

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      await refreshEvents(); // populates eventsStore
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
        // Outbound: another editor wants us to select/edit an event
        switch (ticket.destination.mode) {
          case 'select':
            setScreenMode('select');
            return;
          case 'edit': {
            const id = ticket.destination.objectId;
            if (!id) throw new Error('[Events BOOTSTRAP]: outbound edit missing objectId');
            // Read store imperatively for bootstrap
            const currentCatalog = eventsStore.getSnapshot();
            const found = currentCatalog
              ? Object.values(currentCatalog.events).find((e) => e.id === id)
              : undefined;
            if (found) {
              const key: EditorKey = { kind: 'events', id };
              editSessionsDataStore.setSnapshot(key, eventToFormDraft(found));
              setEditorKeyId(id);
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

  // Cleanup editSessionsDataStore on unmount
  useEffect(() => {
    return () => {
      const key = editorKeyRef.current;
      if (key) {
        editSessionsDataStore.clear(key);
      }
    };
  }, []);

  const selectEvent = useCallback(
    (id: string) => {
      const found = events.find((e) => e.id === id);
      if (!found) return;
      const key: EditorKey = { kind: 'events', id };
      editSessionsDataStore.setSnapshot(key, eventToFormDraft(found));
      setEditorKeyId(id);
      setScreenMode('edit');
    },
    [events],
  );

  const createNew = useCallback(() => {
    const key: EditorKey = { kind: 'events', id: '__new__' };
    editSessionsDataStore.setSnapshot(key, { ...EMPTY_DRAFT });
    setEditorKeyId('__new__');
    setScreenMode('create');
  }, []);

  const back = useCallback(() => {
    if (editorKey) {
      clearSession();
    }
    setEditorKeyId(null);
    if (isJourney) {
      returnHome('events', { ok: false, reason: 'cancel' });
      return;
    }
    setScreenMode('list');
  }, [editorKey, clearSession, isJourney, returnHome]);

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
      // Clear editor session
      if (editorKey) {
        clearSession();
      }
      setEditorKeyId(null);
      // Refresh both admin store and public cache
      await refreshEvents();
      invalidateEventsCache();
      setScreenMode('list');
    } catch (err) {
      console.error('[EventEditorSession] Save failed', err);
      alert(`Failed to save event: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [screenMode, draft, editorKey, clearSession]);

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!confirm('Delete this event?')) return;
      try {
        setIsSaving(true);
        await eventsAdminApi.remove(id);
        // Clear editor session
        if (editorKey) {
          clearSession();
        }
        setEditorKeyId(null);
        // Refresh both admin store and public cache
        await refreshEvents();
        invalidateEventsCache();
        setScreenMode('list');
      } catch (err) {
        console.error('[EventEditorSession] Delete failed', err);
        alert(`Failed to delete event: ${err}`);
      } finally {
        setIsSaving(false);
      }
    },
    [editorKey, clearSession],
  );

  const setDraftField = useCallback(
    <K extends keyof EventDraft>(field: K, value: EventDraft[K]) => {
      const current = editorKey ? editSessionsDataStore.get<EventDraft>(editorKey)?.draft : null;
      if (!current) return;
      setStoreDraft({ ...current, [field]: value });
    },
    [editorKey, setStoreDraft],
  );

  const onTitleChange = useCallback(
    (value: string) => {
      const current = editorKey ? editSessionsDataStore.get<EventDraft>(editorKey)?.draft : null;
      if (!current) return;
      const next = { ...current, titleEn: value };
      if (screenMode === 'create') {
        next.slug = slugify(value);
      }
      setStoreDraft(next);
    },
    [editorKey, screenMode, setStoreDraft],
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
