// features/admin/eventPageEditor/session/EventPageEditorSession.context.tsx
// Editor session for Event Pages (EventPageData).
// Mode stack, draft lifecycle, Journey bootstrap, save/exit.

import type { EventPageData, EventPreset } from '@/entities/event';
import { createEventPage } from '@/entities/event';
import type { EditorKey, JourneyTicket } from '@/shared/nav';
import { editSessionsDataStore, eventPagesStore, useSessionDataStore, useStoreData } from '@/shared/state';
import {
  useArrival,
  useDispatch,
  useJourneyStatus,
  useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { invalidateEventPagesCache } from '@/features/public/api/eventPagesModule';
import { eventPagesAdminApi, refreshEventPages } from '../api/eventPagesAdminApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScreenMode = 'select' | 'create' | 'edit' | 'preview';

export interface EventPageEditorSession {
  // State
  pages: EventPageData[];
  screenMode: ScreenMode;
  draft: EventPageData | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;

  // Mode transitions
  selectEvent: (id: string) => void;
  createNew: (preset: EventPreset) => void;
  pushMode: (mode: ScreenMode) => void;
  back: () => void;

  // Draft editing
  setDraftField: (field: string, value: unknown) => void;

  // Visual pickers (media items or art catalog)
  pickMedia: (targetField: string, activeSection?: string, mode?: 'set' | 'append' | 'appendWork') => void;
  pickArt: (targetField: string, activeSection?: string, mode?: 'set' | 'append' | 'appendWork') => void;
  /** Section to restore after picker return. Consumed once on read. */
  consumeRestoredSection: () => string | null;

  // Actions
  save: () => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Journey
  isJourney: boolean;
  selectAndReturn: (eventId: string) => void;
  cancelSelect: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const Ctx = createContext<EventPageEditorSession | undefined>(undefined);

export function useEventPageEditorSession(): EventPageEditorSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEventPageEditorSession must be inside EventPageEditorSessionProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEditorKey(id: string | null): EditorKey | undefined {
  if (!id) return undefined;
  return { kind: 'eventPages', id };
}

// Module-level: survives component unmount/remount during media picker navigation.
// A React ref would be destroyed on unmount when the router navigates away.
// This is consistent with Journey state, which also wouldn't survive a full page reload.
type MediaPickAction = { field: string; mode: 'set' | 'append' | 'appendWork' };
let _pendingMediaAction: MediaPickAction | null = null;
let _pendingActiveSection: string | null = null;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EventPageEditorSessionProvider({ children }: { children: React.ReactNode }) {
  // ── External store: event pages list ──
  const catalog = useStoreData(eventPagesStore);
  const pages = useMemo(
    () => (catalog ? Object.values(catalog.pages) : []),
    [catalog],
  );

  // ── External store: editor draft ──
  const [editorKeyId, setEditorKeyId] = useState<string | null>(null);
  const editorKey = useMemo(() => makeEditorKey(editorKeyId), [editorKeyId]);
  const { storeData, setDraft: setStoreDraft, setSnapshot, clear: clearSession, commit } =
    useSessionDataStore<EventPageData>(editorKey);
  const draft = storeData?.draft ?? null;
  const isDirty = storeData
    ? JSON.stringify(storeData.draft) !== JSON.stringify(storeData.snapshot)
    : false;

  // ── Mode stack ──
  const [modeStack, setModeStack] = useState<ScreenMode[]>(['select']);
  const screenMode = modeStack[modeStack.length - 1]!;

  // ── Transient UI state ──
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Journey hooks ──
  const arrival = useArrival();
  const dispatch = useDispatch();
  const returnHome = useReturnHome();
  const isJourney = useJourneyStatus('eventPages');

  // ── Strict Mode protection ──
  const bootstrapRef = useRef<{ processed: boolean }>({ processed: false });
  const editorKeyRef = useRef(editorKey);
  editorKeyRef.current = editorKey;

  // ── Load pages ──
  const loadPages = useCallback(async () => {
    try {
      setIsLoading(true);
      await refreshEventPages();
    } catch (err) {
      console.error('[EventPageEditor] Failed to load pages', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Bootstrap ──
  useEffect(() => {
    if (bootstrapRef.current.processed) return;
    bootstrapRef.current = { processed: true };

    void (async () => {
      await loadPages();

      const ticket = arrival('eventPages');
      if (!ticket) {
        setModeStack(['select']);
        return;
      }

      if (!ticket.loot) {
        switch (ticket.destination.mode) {
          case 'select':
            setModeStack(['select']);
            return;
          case 'edit': {
            const id = ticket.destination.objectId;
            if (!id) throw new Error('[EventPageEditor BOOTSTRAP]: outbound edit missing objectId');
            const currentCatalog = eventPagesStore.getSnapshot();
            const found = currentCatalog?.pages[id];
            if (found) {
              const key: EditorKey = { kind: 'eventPages', id };
              editSessionsDataStore.setSnapshot(key, found);
              setEditorKeyId(id);
              setModeStack(['select', 'edit']);
            }
            return;
          }
        }
      }

      // RETURN from Media picker with loot
      if (ticket.loot?.ok) {
        const action = _pendingMediaAction;
        const eventId = ticket.returnTo.objectId;
        if (action && eventId) {
          const key: EditorKey = { kind: 'eventPages', id: eventId };
          const savedSession = editSessionsDataStore.get<EventPageData>(key);
          const baseDraft = savedSession?.draft;
          if (baseDraft) {
            const rec = baseDraft as unknown as Record<string, unknown>;
            let updated: EventPageData;
            if (action.mode === 'set') {
              updated = { ...baseDraft, [action.field]: ticket.loot.id } as EventPageData;
            } else if (action.mode === 'append') {
              const existing = (rec[action.field] as string[] | undefined) ?? [];
              updated = { ...baseDraft, [action.field]: [...existing, ticket.loot.id] } as EventPageData;
            } else {
              // appendWork — add CaptionedWork with just the image, user fills title/medium later
              const existing = (rec[action.field] as { image: string; title: Record<string, string> }[] | undefined) ?? [];
              const newWork = { image: ticket.loot.id, title: {} };
              updated = { ...baseDraft, [action.field]: [...existing, newWork] } as EventPageData;
            }
            const currentCatalog = eventPagesStore.getSnapshot();
            const snapshot = currentCatalog?.pages[eventId] ?? baseDraft;
            editSessionsDataStore.setSnapshot(key, snapshot);
            editSessionsDataStore.saveDraft(key, updated);
            setEditorKeyId(eventId);
            setModeStack(['select', 'edit']);
            _pendingMediaAction = null;
            return;
          }
        }
        _pendingMediaAction = null;
      }

      // Cancel or failed loot — restore draft without modification
      if (ticket.loot && !ticket.loot.ok) {
        const eventId = ticket.returnTo.objectId;
        if (_pendingMediaAction && eventId) {
          const key: EditorKey = { kind: 'eventPages', id: eventId };
          const savedSession = editSessionsDataStore.get<EventPageData>(key);
          if (savedSession?.draft) {
            setEditorKeyId(eventId);
            setModeStack(['select', 'edit']);
          }
        }
        _pendingMediaAction = null;
        return;
      }

      setModeStack(['select']);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      // Skip cleanup during media picker round-trip — draft must survive remount
      if (_pendingMediaAction) return;
      const key = editorKeyRef.current;
      if (key) editSessionsDataStore.clear(key);
    };
  }, []);

  // ── Mode transitions ──
  const pushMode = useCallback((mode: ScreenMode) => {
    setModeStack((s) => [...s, mode]);
  }, []);

  const back = useCallback(() => {
    setModeStack((s) => {
      if (s.length <= 1) return s;
      const next = s.slice(0, -1);
      // If leaving edit mode, clear session
      if (s[s.length - 1] === 'edit') {
        if (editorKeyRef.current) {
          editSessionsDataStore.clear(editorKeyRef.current);
        }
        setEditorKeyId(null);
      }
      return next;
    });
  }, []);

  // ── Create ──
  const createNew = useCallback(
    (preset: EventPreset) => {
      const page = createEventPage(preset);
      const key: EditorKey = { kind: 'eventPages', id: page.id };
      editSessionsDataStore.setSnapshot(key, page);
      setEditorKeyId(page.id);
      setModeStack((s) => {
        // Replace 'create' with 'edit' if on top, else push 'edit'
        const base = s[s.length - 1] === 'create' ? s.slice(0, -1) : s;
        return [...base, 'edit'];
      });
    },
    [],
  );

  // ── Select existing ──
  const selectEvent = useCallback(
    (id: string) => {
      const found = pages.find((p) => p.id === id);
      if (!found) return;
      const key: EditorKey = { kind: 'eventPages', id };
      editSessionsDataStore.setSnapshot(key, found);
      setEditorKeyId(id);
      setModeStack((s) => [...s, 'edit']);
    },
    [pages],
  );

  // ── Draft editing ──
  const setDraftField = useCallback(
    (field: string, value: unknown) => {
      if (!editorKey || !draft) return;
      setStoreDraft({ ...draft, [field]: value } as EventPageData);
    },
    [editorKey, draft, setStoreDraft],
  );

  // ── Media picker — generic field-targeted contract ──
  // Works for any MediaRef field (heroImage, experienceImages, etc.).
  // Step 8 wires heroImage; future steps wire additional fields through the same function.
  const consumeRestoredSection = useCallback((): string | null => {
    const section = _pendingActiveSection;
    _pendingActiveSection = null;
    return section;
  }, []);

  /** Dispatch to a visual picker (media or art catalog). */
  const dispatchVisualPicker = useCallback(
    (
      targetEditor: 'mediaItems' | 'catalog',
      targetField: string,
      activeSection?: string,
      mode: 'set' | 'append' | 'appendWork' = 'set',
    ) => {
      if (!editorKey || !draft) return;
      _pendingMediaAction = { field: targetField, mode };
      _pendingActiveSection = activeSection ?? null;
      const currentDraft = editSessionsDataStore.get<EventPageData>(editorKey)?.draft ?? draft;
      editSessionsDataStore.saveDraft(editorKey, currentDraft);
      const ticket: JourneyTicket = {
        journeyId: generateId('travel'),
        destination: { editor: targetEditor, mode: 'select' },
        returnTo: { editor: 'eventPages', mode: 'edit', objectId: currentDraft.id },
        phase: 'outbound',
        nonce: createNonce(),
        createdAt: nowIso(),
        returnEffect: undefined,
      };
      const home: JourneyHome = { editor: 'eventPages', objectId: currentDraft.id };
      dispatch(ticket, home);
    },
    [editorKey, draft, dispatch],
  );

  const pickMedia = useCallback(
    (targetField: string, activeSection?: string, mode: 'set' | 'append' | 'appendWork' = 'set') => {
      dispatchVisualPicker('mediaItems', targetField, activeSection, mode);
    },
    [dispatchVisualPicker],
  );

  const pickArt = useCallback(
    (targetField: string, activeSection?: string, mode: 'set' | 'append' | 'appendWork' = 'set') => {
      dispatchVisualPicker('catalog', targetField, activeSection, mode);
    },
    [dispatchVisualPicker],
  );

  // ── Save ──
  const save = useCallback(async () => {
    if (!draft || !editorKey) return;
    try {
      setIsSaving(true);
      // Check if this is a new page (not yet persisted)
      const currentCatalog = eventPagesStore.getSnapshot();
      const exists = currentCatalog?.pages[draft.id];
      if (exists) {
        await eventPagesAdminApi.update(draft.id, draft);
      } else {
        await eventPagesAdminApi.create(draft);
      }
      // Sync snapshot to match draft (clears dirty)
      commit();
      await refreshEventPages();
      // Invalidate the public-side module cache so public renderers
      // (and any preview path that went through /public/event-pages)
      // observe the save on next load.
      invalidateEventPagesCache();

      // In journey mode, return after save
      if (isJourney) {
        returnHome('eventPages', { ok: true, id: draft.id });
        return;
      }
    } catch (err) {
      console.error('[EventPageEditor] Save failed', err);
      alert(`Failed to save: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [draft, editorKey, commit, isJourney, returnHome]);

  // ── Delete ──
  const deleteEvent = useCallback(
    async (id: string) => {
      if (!confirm('Delete this event page? This cannot be undone.')) return;
      try {
        setIsSaving(true);
        // Check if the page has been saved to the backend
        const currentCatalog = eventPagesStore.getSnapshot();
        const persisted = currentCatalog?.pages[id];
        if (persisted) {
          await eventPagesAdminApi.remove(id);
          await refreshEventPages();
          invalidateEventPagesCache();
        }
        // Clear local session (works for both persisted and unsaved drafts)
        if (editorKey) clearSession();
        setEditorKeyId(null);
        setModeStack(['select']);
      } catch (err) {
        console.error('[EventPageEditor] Delete failed', err);
        alert(`Failed to delete: ${err}`);
      } finally {
        setIsSaving(false);
      }
    },
    [editorKey, clearSession],
  );

  // ── Journey ──
  const selectAndReturn = useCallback(
    (eventId: string) => {
      if (!isJourney) return;
      returnHome('eventPages', { ok: true, id: eventId });
    },
    [isJourney, returnHome],
  );

  const cancelSelect = useCallback(() => {
    if (!isJourney) return;
    returnHome('eventPages', { ok: false, reason: 'cancel' });
  }, [isJourney, returnHome]);

  // ── Session ──
  const session: EventPageEditorSession = {
    pages,
    screenMode,
    draft,
    isLoading,
    isSaving,
    isDirty,
    selectEvent,
    createNew,
    pushMode,
    back,
    setDraftField,
    pickMedia,
    pickArt,
    consumeRestoredSection,
    save,
    deleteEvent,
    isJourney,
    selectAndReturn,
    cancelSelect,
  };

  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}
