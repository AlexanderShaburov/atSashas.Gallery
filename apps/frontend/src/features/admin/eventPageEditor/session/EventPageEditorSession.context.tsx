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
import { useNavigate } from 'react-router-dom';
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
  const { storeData, setDraft: setStoreDraft, clear: clearSession, commit } =
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

  const editorKeyRef = useRef(editorKey);
  editorKeyRef.current = editorKey;

  const modeStackRef = useRef(modeStack);
  modeStackRef.current = modeStack;

  // Deep-link return path. Populated by the bootstrap effect when the
  // editor was reached via `/admin/event-pages?edit=<id>&returnTo=<path>`
  // (e.g. from the admin enrollments detail page). Consumed by `back()`
  // when the user exits edit mode — we navigate to the return path
  // instead of dropping to the generic select state. Cleared on consumption
  // so a subsequent unrelated back() inside the editor doesn't loop.
  const returnOnExitRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // ── Bootstrap (StrictMode-safe: cancelled flag + single effect) ──
  //
  // Previous version used a module-level ref as a "run once" guard and a
  // separate cleanup effect that cleared the session on unmount. Under
  // React 18 StrictMode the guard kept the second mount from re-seeding
  // state while the cleanup effect still wiped the session on the fake
  // unmount — producing empty state and emitting store notifications
  // mid-cycle that surfaced as a "setState while rendering" warning.
  //
  // Here we use the idiomatic cancellation pattern: both mounts run the
  // effect, but in-flight state writes from the cancelled run are no-ops
  // after the cleanup flag flips. On real unmount (no pending picker
  // journey), we still clear the session; on the strict-mode fake
  // unmount the cleanup still runs, but because the second mount rewinds
  // through the same logic, the state ends up consistent either way.
  useEffect(() => {
    let cancelled = false;

    const setModeStackIfActive = (next: ScreenMode[]) => {
      if (!cancelled) setModeStack(next);
    };
    const setEditorKeyIdIfActive = (next: string | null) => {
      if (!cancelled) setEditorKeyId(next);
    };

    void (async () => {
      try {
        setIsLoading(true);
        await refreshEventPages();
      } catch (err) {
        console.error('[EventPageEditor] Failed to load pages', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      if (cancelled) return;

      const ticket = arrival('eventPages');
      if (!ticket) {
        // Deep-link entry: /admin/event-pages?edit=<id>[&returnTo=<path>]
        // opens that event in edit mode directly. Used by the admin
        // Enrollments detail view. The params are consumed once and
        // stripped from the URL so back/forward navigation does not
        // re-trigger them. `returnTo` is stored for `back()` to consume
        // when the user exits edit mode, landing them back at the caller
        // surface instead of the editor's select state.
        const params = new URLSearchParams(window.location.search);
        const deepLinkId = params.get('edit');
        const rawReturnTo = params.get('returnTo');
        // Guard against open-redirect — only accept in-app admin paths.
        const safeReturnTo =
          rawReturnTo && rawReturnTo.startsWith('/admin/') ? rawReturnTo : null;

        if (deepLinkId) {
          const currentCatalog = eventPagesStore.getSnapshot();
          const found = currentCatalog?.pages[deepLinkId];
          if (found && !cancelled) {
            const key: EditorKey = { kind: 'eventPages', id: deepLinkId };
            editSessionsDataStore.setSnapshot(key, found);
            setEditorKeyIdIfActive(deepLinkId);
            setModeStackIfActive(['select', 'edit']);
            if (safeReturnTo) returnOnExitRef.current = safeReturnTo;
          } else {
            setModeStackIfActive(['select']);
          }
          params.delete('edit');
          params.delete('returnTo');
          const newSearch = params.toString();
          const newUrl =
            window.location.pathname +
            (newSearch ? `?${newSearch}` : '') +
            window.location.hash;
          window.history.replaceState(window.history.state, '', newUrl);
          return;
        }
        setModeStackIfActive(['select']);
        return;
      }

      if (!ticket.loot) {
        switch (ticket.destination.mode) {
          case 'select':
            setModeStackIfActive(['select']);
            return;
          case 'edit': {
            const id = ticket.destination.objectId;
            if (!id) throw new Error('[EventPageEditor BOOTSTRAP]: outbound edit missing objectId');
            const currentCatalog = eventPagesStore.getSnapshot();
            const found = currentCatalog?.pages[id];
            if (found && !cancelled) {
              const key: EditorKey = { kind: 'eventPages', id };
              editSessionsDataStore.setSnapshot(key, found);
              setEditorKeyIdIfActive(id);
              setModeStackIfActive(['select', 'edit']);
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
          if (baseDraft && !cancelled) {
            const rec = baseDraft as unknown as Record<string, unknown>;
            let updated: EventPageData;
            if (action.mode === 'set') {
              updated = { ...baseDraft, [action.field]: ticket.loot.id } as EventPageData;
            } else if (action.mode === 'append') {
              const existing = (rec[action.field] as string[] | undefined) ?? [];
              updated = { ...baseDraft, [action.field]: [...existing, ticket.loot.id] } as EventPageData;
            } else {
              const existing = (rec[action.field] as { image: string; title: Record<string, string> }[] | undefined) ?? [];
              const newWork = { image: ticket.loot.id, title: {} };
              updated = { ...baseDraft, [action.field]: [...existing, newWork] } as EventPageData;
            }
            const currentCatalog = eventPagesStore.getSnapshot();
            const snapshot = currentCatalog?.pages[eventId] ?? baseDraft;
            editSessionsDataStore.setSnapshot(key, snapshot);
            editSessionsDataStore.saveDraft(key, updated);
            setEditorKeyIdIfActive(eventId);
            setModeStackIfActive(['select', 'edit']);
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
          if (savedSession?.draft && !cancelled) {
            setEditorKeyIdIfActive(eventId);
            setModeStackIfActive(['select', 'edit']);
          }
        }
        _pendingMediaAction = null;
        return;
      }

      setModeStackIfActive(['select']);
    })();

    return () => {
      cancelled = true;
      // Real unmount cleanup. Skip during a pending picker journey — the
      // draft must survive remount. StrictMode's fake unmount also runs
      // this but the cancelled flag above neutralizes any in-flight state
      // writes, and the remount re-runs the bootstrap clean.
      if (_pendingMediaAction) return;
      const key = editorKeyRef.current;
      if (key) editSessionsDataStore.clear(key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mode transitions ──
  const pushMode = useCallback((mode: ScreenMode) => {
    setModeStack((s) => [...s, mode]);
  }, []);

  // `back()` must keep the setState updater pure: no sibling setters, no
  // external-store emits inside it. Doing so produced a "Cannot update a
  // component while rendering a different component" warning during the
  // Edit → Select transition because emit() fired listeners and a second
  // setter was queued while the updater was executing in the render phase.
  //
  // When the editor was opened via `?edit=<id>&returnTo=<path>` (deep link
  // from the admin Enrollments detail view), `back()` navigates to the
  // stored return path instead of popping into select mode. This preserves
  // the caller's context instead of leaving the admin in a generic editor
  // state.
  const back = useCallback(() => {
    const current = modeStackRef.current;
    if (current.length <= 1) return;
    const leavingEdit = current[current.length - 1] === 'edit';

    if (leavingEdit) {
      if (editorKeyRef.current) {
        editSessionsDataStore.clear(editorKeyRef.current);
      }
      setEditorKeyId(null);

      const returnTo = returnOnExitRef.current;
      if (returnTo) {
        returnOnExitRef.current = null;
        navigate(returnTo);
        return;
      }
    }
    setModeStack((s) => (s.length <= 1 ? s : s.slice(0, -1)));
  }, [navigate]);

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
