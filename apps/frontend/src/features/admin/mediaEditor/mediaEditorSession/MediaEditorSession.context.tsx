// features/admin/mediaEditor/mediaEditorSession/MediaEditorSession.context.tsx

import type { MediaItemData } from '@/entities/mediaItem';
import type { EditorKey, JourneyTicket } from '@/shared/nav';
import {
  useArrival,
  useDispatch,
  useJourneyStatus,
  useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { editSessionsDataStore, useSessionDataStore, useStoreData } from '@/shared/state';
import { blocksCollectionStore, eventPagesStore, mediaItemsStore } from '@/shared/state/domain';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mediaItemsAdminApi, refreshMediaItems } from '../api/mediaItemsAdminApi';
import { filterMediaItems, type MediaFilterState } from '../logic/filterMediaItems';
import { findMediaDependencies, type MediaDependency } from '../logic/findMediaDependencies';
import { buildHopperTicket, processHopperReturn } from '../logic/hopperIntegration';

// 'create' is a technical creation state aligned with edit-mode behavior, not a separate paradigm.
// 'pick' is an inbound Journey mode for selection/return — not destructive management.
type ScreenMode = 'select' | 'edit' | 'create' | 'pick';

export interface DeletionBlock {
  deps: MediaDependency[];
}

export interface MediaEditorSession {
  mediaItems: MediaItemData[];
  filteredItems: MediaItemData[];
  allTags: string[];
  filter: MediaFilterState;
  updateFilter: (patch: Partial<MediaFilterState>) => void;
  screenMode: ScreenMode;
  draft: MediaItemData | undefined;
  isDirty: boolean;
  isValid: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isJourney: boolean;
  deletionBlock: DeletionBlock | undefined;

  setDraftField: <K extends keyof MediaItemData>(field: K, value: MediaItemData[K]) => void;
  save: () => Promise<void>;
  deleteItem: () => Promise<void>;
  dismissDeletionBlock: () => void;
  /** In normal mode: open item for editing. In pick mode: return item to caller immediately. */
  selectItem: (id: string) => void;
  onAdd: () => void;
  cancelPick: () => void;
  back: () => void;
}

const MediaEditorSessionContext = createContext<MediaEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useMediaEditorSession(): MediaEditorSession {
  const ctx = useContext(MediaEditorSessionContext);
  if (!ctx) {
    throw new Error('useMediaEditorSession must be used within MediaEditorSessionProvider');
  }
  return ctx;
}

function makeEditorKey(id: string | null): EditorKey | undefined {
  if (!id) return undefined;
  return { kind: 'mediaItems', id };
}

/** Build a GridItem-shaped output for Journey return from a MediaItemData. */
function mediaToGridOutput(item: MediaItemData) {
  const thumb =
    item.media.kind === 'image'
      ? (item.media.sources.preview.jpeg ?? item.media.sources.full)
      : item.media.kind === 'video'
        ? (item.media.sources.posterUrl ?? '')
        : '';
  return { id: item.id, thumbUrl: thumb, title: item.title?.en };
}

export function MediaEditorSessionProvider({ children }: { children: React.ReactNode }) {
  // -- External store: media items catalog --
  const catalog = useStoreData(mediaItemsStore);
  const mediaItems = useMemo(
    () => (catalog ? catalog.order.map((id) => catalog.items[id]).filter(Boolean) as MediaItemData[] : []),
    [catalog],
  );

  // -- External store: editor draft --
  const [editorKeyId, setEditorKeyId] = useState<string | null>(null);
  const editorKey = useMemo(() => makeEditorKey(editorKeyId), [editorKeyId]);
  const { storeData, setDraft: setStoreDraft, clear: clearSession } =
    useSessionDataStore<MediaItemData>(editorKey);
  const draft = storeData?.draft;
  const snapshot = storeData?.snapshot;

  // -- Filter state (transient UI -- per ADR-003) --
  const [filter, setFilter] = useState<MediaFilterState>({});

  const updateFilter = useCallback((patch: Partial<MediaFilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  }, []);

  const filteredItems = useMemo(
    () => filterMediaItems(mediaItems, filter),
    [mediaItems, filter],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of mediaItems) {
      item.tags?.forEach((t) => tags.add(t));
    }
    return Array.from(tags).sort();
  }, [mediaItems]);

  // -- Transient UI state (stays in Context -- per ADR-003) --
  const [screenMode, setScreenMode] = useState<ScreenMode>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletionBlock, setDeletionBlock] = useState<DeletionBlock | undefined>(undefined);

  // -- Journey navigation --
  const arrival = useArrival();
  const dispatch = useDispatch();
  const returnHome = useReturnHome();
  const isJourney = useJourneyStatus('mediaItems');

  // -- React Strict Mode protection for bootstrap --
  const bootstrapRef = useRef<{ processed: boolean; ticket: JourneyTicket | undefined }>({
    processed: false,
    ticket: undefined,
  });

  // Track editorKey for cleanup on unmount
  const editorKeyRef = useRef(editorKey);
  editorKeyRef.current = editorKey;

  // -- Bootstrap: load data + handle Journey arrival --
  useEffect(() => {
    if (bootstrapRef.current.processed) return;

    // Consume arrival synchronously FIRST (before async), matching catalog pattern
    const ticket = arrival('mediaItems');
    bootstrapRef.current = { processed: true, ticket };

    void (async () => {
      try {
        setIsLoading(true);
        await refreshMediaItems();
      } catch (err) {
        console.error('[MediaEditorSession] Failed to load media items', err);
      } finally {
        setIsLoading(false);
      }

      if (!ticket) {
        setScreenMode('select');
        return;
      }

      // RETURN from Hopper with loot
      const newDraft = processHopperReturn(ticket);
      if (newDraft) {
        const key: EditorKey = { kind: 'mediaItems', id: newDraft.id };
        editSessionsDataStore.setSnapshot(key, newDraft);
        setEditorKeyId(newDraft.id);
        setScreenMode('create');
        return;
      }

      if (ticket.loot && !ticket.loot.ok) {
        // Hopper cancelled — fall back to select
        setScreenMode('select');
        return;
      }

      // INBOUND from another editor (no loot = outbound leg)
      if (!ticket.loot) {
        if (ticket.destination.mode === 'select') {
          // Picker mode: another editor wants us to pick a media item
          setScreenMode('pick');
          return;
        }
      }

      setScreenMode('select');
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

  const selectItem = useCallback(
    (id: string) => {
      const found = mediaItems.find((mi) => mi.id === id);
      if (!found) return;

      if (screenMode === 'pick') {
        // Picker mode: return selected item immediately to caller
        returnHome('mediaItems', { ok: true, id: found.id, output: mediaToGridOutput(found) });
        return;
      }

      // Normal mode: open for editing
      const key: EditorKey = { kind: 'mediaItems', id };
      editSessionsDataStore.setSnapshot(key, found);
      setEditorKeyId(id);
      setScreenMode('edit');
    },
    [mediaItems, screenMode, returnHome],
  );

  const cancelPick = useCallback(() => {
    if (isJourney) {
      returnHome('mediaItems', { ok: false, reason: 'cancel' });
    }
  }, [isJourney, returnHome]);

  const isDirty = useMemo(() => {
    if (!draft || !snapshot) return false;
    return JSON.stringify(draft) !== JSON.stringify(snapshot);
  }, [draft, snapshot]);

  const isValid = useMemo(() => {
    if (!draft) return false;
    if (draft.media.kind === 'image' && !draft.media.sources.full) return false;
    if (draft.media.kind === 'video' && !draft.media.sources.url) return false;
    return true;
  }, [draft]);

  const setDraftField = useCallback(
    <K extends keyof MediaItemData>(field: K, value: MediaItemData[K]) => {
      if (!editorKey) return;
      const current = editSessionsDataStore.get<MediaItemData>(editorKey)?.draft;
      if (!current) return;
      setStoreDraft({ ...current, [field]: value });
    },
    [editorKey, setStoreDraft],
  );

  const save = useCallback(async () => {
    if (!draft || !editorKey) return;
    try {
      setIsSaving(true);
      let persistedId: string;
      if (screenMode === 'create') {
        const { id: _tempId, ...payload } = draft;
        const created = await mediaItemsAdminApi.create(payload);
        persistedId = created.id;
      } else {
        await mediaItemsAdminApi.update(draft.id, draft);
        persistedId = draft.id;
      }
      clearSession();
      setEditorKeyId(null);
      await refreshMediaItems();

      // If in a Journey (upload-during-pick), return the persisted item to caller
      if (isJourney && screenMode === 'create') {
        const persisted = mediaItemsStore.get()?.items[persistedId];
        if (persisted) {
          returnHome('mediaItems', {
            ok: true,
            id: persistedId,
            output: mediaToGridOutput(persisted),
          });
          return;
        }
      }

      setScreenMode(isJourney ? 'pick' : 'select');
    } catch (err) {
      console.error('[MediaEditorSession] Save failed', err);
      alert(`Failed to save media item: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [draft, editorKey, screenMode, isJourney, clearSession, returnHome]);

  const onAdd = useCallback(() => {
    const ticket = buildHopperTicket();
    const home: JourneyHome = { editor: 'mediaItems', objectId: undefined };
    dispatch(ticket, home);
  }, [dispatch]);

  // Delete is only available in 'edit' mode (persisted items).
  // Intentionally unavailable in 'create' (unsaved draft) and 'pick' (picker/Journey) modes.
  // Picker mode is for selection/return, not destructive media management.
  const deleteItem = useCallback(async () => {
    if (!draft || screenMode !== 'edit') return;

    const blocks = blocksCollectionStore.get()?.blocks ?? {};
    const eventPages = eventPagesStore.get()?.pages ?? {};
    const deps = findMediaDependencies(draft.id, blocks, eventPages);

    if (deps.length > 0) {
      setDeletionBlock({ deps });
      return;
    }

    if (!confirm(`Delete "${draft.title?.en ?? draft.id}"?`)) return;

    try {
      setIsSaving(true);
      await mediaItemsAdminApi.remove(draft.id);
      clearSession();
      setEditorKeyId(null);
      await refreshMediaItems();
      setScreenMode('select');
    } catch (err) {
      console.error('[MediaEditorSession] Delete failed', err);
      alert(`Failed to delete media item: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [draft, screenMode, clearSession]);

  const dismissDeletionBlock = useCallback(() => {
    setDeletionBlock(undefined);
  }, []);

  const back = useCallback(() => {
    if (editorKey) {
      clearSession();
    }
    setEditorKeyId(null);
    // If in journey picker, return to pick grid (not exit journey)
    setScreenMode(isJourney ? 'pick' : 'select');
  }, [editorKey, isJourney, clearSession]);

  const session: MediaEditorSession = {
    mediaItems,
    filteredItems,
    allTags,
    filter,
    updateFilter,
    screenMode,
    draft,
    isDirty,
    isValid,
    isLoading,
    isSaving,
    isJourney,
    deletionBlock,
    setDraftField,
    save,
    deleteItem,
    dismissDeletionBlock,
    selectItem,
    onAdd,
    cancelPick,
    back,
  };

  return (
    <MediaEditorSessionContext.Provider value={session}>
      {children}
    </MediaEditorSessionContext.Provider>
  );
}
