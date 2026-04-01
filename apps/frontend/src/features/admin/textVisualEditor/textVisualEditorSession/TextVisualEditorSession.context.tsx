// features/admin/textVisualEditor/textVisualEditorSession/TextVisualEditorSession.context.tsx

import type {
  TextVisualBackground,
  TextVisualData,
  TextVisualOverlay,
  TextVisualTextBox,
  TextVisualTypography,
} from '@/entities/textVisual';
import type { EditorKey } from '@/shared/nav';
import { editSessionsDataStore, useSessionDataStore, useStoreData } from '@/shared/state';
import { textVisualsStore } from '@/shared/state/domain';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  refreshTextVisuals,
  textVisualsAdminApi,
  type CreateTextVisualPayload,
} from '../api/textVisualsAdminApi';

type ScreenMode = 'list' | 'edit' | 'create';

export interface TextVisualDraft {
  id?: string;
  titleEn: string;
  subtitleEn: string;
  bodyEn: string;
  captionEn: string;
  backgroundKind: 'image' | 'color' | 'gradient';
  backgroundImageUrl: string;
  backgroundColor: string;
  backgroundGradient: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: string;
  textColor: string;
  textBoxX: string;
  textBoxY: string;
  textBoxWidth: string;
  textBoxHeight: string;
  textBoxPadding: string;
  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: string;
  overlayBlur: string;
}

const EMPTY_DRAFT: TextVisualDraft = {
  titleEn: '',
  subtitleEn: '',
  bodyEn: '',
  captionEn: '',
  backgroundKind: 'color',
  backgroundImageUrl: '',
  backgroundColor: '#ffffff',
  backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  fontFamily: 'Inter',
  fontSize: '16',
  fontWeight: '400',
  textAlign: 'left',
  lineHeight: '1.5',
  textColor: '#000000',
  textBoxX: '10',
  textBoxY: '10',
  textBoxWidth: '80',
  textBoxHeight: '80',
  textBoxPadding: '16',
  overlayEnabled: false,
  overlayColor: '#000000',
  overlayOpacity: '0.5',
  overlayBlur: '0',
};

function dataToFormDraft(d: TextVisualData): TextVisualDraft {
  return {
    id: d.id,
    titleEn: d.title?.en ?? '',
    subtitleEn: d.subtitle?.en ?? '',
    bodyEn: d.body?.en ?? '',
    captionEn: d.caption?.en ?? '',
    backgroundKind: d.background.kind,
    backgroundImageUrl: d.background.kind === 'image' ? d.background.imageUrl : '',
    backgroundColor: d.background.kind === 'color' ? d.background.color : '#ffffff',
    backgroundGradient: d.background.kind === 'gradient' ? d.background.gradient : '',
    fontFamily: d.typography.fontFamily,
    fontSize: d.typography.fontSize.toString(),
    fontWeight: d.typography.fontWeight.toString(),
    textAlign: d.typography.textAlign,
    lineHeight: d.typography.lineHeight.toString(),
    textColor: d.typography.color,
    textBoxX: d.textBox.x.toString(),
    textBoxY: d.textBox.y.toString(),
    textBoxWidth: d.textBox.width.toString(),
    textBoxHeight: d.textBox.height.toString(),
    textBoxPadding: d.textBox.padding.toString(),
    overlayEnabled: !!d.overlay,
    overlayColor: d.overlay?.color ?? '#000000',
    overlayOpacity: d.overlay?.opacity?.toString() ?? '0.5',
    overlayBlur: d.overlay?.blur?.toString() ?? '0',
  };
}

function formDraftToPayload(draft: TextVisualDraft): CreateTextVisualPayload {
  const background: TextVisualBackground =
    draft.backgroundKind === 'image'
      ? { kind: 'image', imageUrl: draft.backgroundImageUrl }
      : draft.backgroundKind === 'gradient'
        ? { kind: 'gradient', gradient: draft.backgroundGradient }
        : { kind: 'color', color: draft.backgroundColor };

  const typography: TextVisualTypography = {
    fontFamily: draft.fontFamily,
    fontSize: Number(draft.fontSize) || 16,
    fontWeight: Number(draft.fontWeight) || 400,
    textAlign: draft.textAlign,
    lineHeight: Number(draft.lineHeight) || 1.5,
    color: draft.textColor,
  };

  const textBox: TextVisualTextBox = {
    x: Number(draft.textBoxX) || 0,
    y: Number(draft.textBoxY) || 0,
    width: Number(draft.textBoxWidth) || 100,
    height: Number(draft.textBoxHeight) || 100,
    padding: Number(draft.textBoxPadding) || 0,
  };

  const overlay: TextVisualOverlay | undefined = draft.overlayEnabled
    ? {
        color: draft.overlayColor,
        opacity: Number(draft.overlayOpacity) || 0.5,
        blur: Number(draft.overlayBlur) || 0,
      }
    : undefined;

  const now = new Date().toISOString().slice(0, 10) as `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

  return {
    lifecycle: 'draft',
    dateCreated: now,
    title: draft.titleEn ? { en: draft.titleEn } : undefined,
    subtitle: draft.subtitleEn ? { en: draft.subtitleEn } : undefined,
    body: draft.bodyEn ? { en: draft.bodyEn } : undefined,
    caption: draft.captionEn ? { en: draft.captionEn } : undefined,
    background,
    typography,
    textBox,
    overlay,
  };
}

export interface TextVisualEditorSession {
  textVisuals: TextVisualData[];
  screenMode: ScreenMode;
  draft: TextVisualDraft;
  isLoading: boolean;
  isSaving: boolean;

  setDraftField: <K extends keyof TextVisualDraft>(field: K, value: TextVisualDraft[K]) => void;
  selectItem: (id: string) => void;
  createNew: () => void;
  back: () => void;
  save: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const TextVisualEditorSessionContext = createContext<TextVisualEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useTextVisualEditorSession(): TextVisualEditorSession {
  const ctx = useContext(TextVisualEditorSessionContext);
  if (!ctx) {
    throw new Error(
      'useTextVisualEditorSession must be used within TextVisualEditorSessionProvider',
    );
  }
  return ctx;
}

function makeEditorKey(id: string | null): EditorKey | undefined {
  if (!id) return undefined;
  return { kind: 'textVisuals', id };
}

export function TextVisualEditorSessionProvider({ children }: { children: React.ReactNode }) {
  // -- External store: text visuals catalog --
  const catalog = useStoreData(textVisualsStore);
  const textVisuals = useMemo(
    () => (catalog ? Object.values(catalog.items) : []),
    [catalog],
  );

  // -- External store: editor draft --
  const [editorKeyId, setEditorKeyId] = useState<string | null>(null);
  const editorKey = useMemo(() => makeEditorKey(editorKeyId), [editorKeyId]);
  const {
    storeData,
    setDraft: setStoreDraft,
    clear: clearSession,
  } = useSessionDataStore<TextVisualDraft>(editorKey);
  const draft = storeData?.draft ?? EMPTY_DRAFT;

  // -- Transient UI state (stays in Context -- per ADR-003) --
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // -- React Strict Mode protection for bootstrap --
  const bootstrapRef = useRef(false);

  // Track editorKey for cleanup on unmount
  const editorKeyRef = useRef(editorKey);
  editorKeyRef.current = editorKey;

  const loadTextVisuals = useCallback(async () => {
    try {
      setIsLoading(true);
      await refreshTextVisuals();
    } catch (err) {
      console.error('[TextVisualEditorSession] Failed to load text visuals', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bootstrap on mount
  useEffect(() => {
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;
    void loadTextVisuals();
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
      const found = textVisuals.find((tv) => tv.id === id);
      if (!found) return;
      const key: EditorKey = { kind: 'textVisuals', id };
      editSessionsDataStore.setSnapshot(key, dataToFormDraft(found));
      setEditorKeyId(id);
      setScreenMode('edit');
    },
    [textVisuals],
  );

  const createNew = useCallback(() => {
    const key: EditorKey = { kind: 'textVisuals', id: '__new__' };
    editSessionsDataStore.setSnapshot(key, { ...EMPTY_DRAFT });
    setEditorKeyId('__new__');
    setScreenMode('create');
  }, []);

  const back = useCallback(() => {
    if (editorKey) {
      clearSession();
    }
    setEditorKeyId(null);
    setScreenMode('list');
  }, [editorKey, clearSession]);

  const save = useCallback(async () => {
    try {
      setIsSaving(true);
      if (screenMode === 'create') {
        const payload = formDraftToPayload(draft);
        await textVisualsAdminApi.create(payload);
      } else if (screenMode === 'edit' && draft.id) {
        const payload = formDraftToPayload(draft);
        const full: TextVisualData = { id: draft.id, ...payload };
        await textVisualsAdminApi.update(draft.id, full);
      }
      // Clear editor session
      if (editorKey) {
        clearSession();
      }
      setEditorKeyId(null);
      await refreshTextVisuals();
      setScreenMode('list');
    } catch (err) {
      console.error('[TextVisualEditorSession] Save failed', err);
      alert(`Failed to save text visual: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [screenMode, draft, editorKey, clearSession]);

  const deleteItem = useCallback(
    async (id: string) => {
      if (!confirm('Delete this text visual?')) return;
      try {
        setIsSaving(true);
        await textVisualsAdminApi.remove(id);
        if (editorKey) {
          clearSession();
        }
        setEditorKeyId(null);
        await refreshTextVisuals();
        setScreenMode('list');
      } catch (err) {
        console.error('[TextVisualEditorSession] Delete failed', err);
        alert(`Failed to delete text visual: ${err}`);
      } finally {
        setIsSaving(false);
      }
    },
    [editorKey, clearSession],
  );

  const setDraftField = useCallback(
    <K extends keyof TextVisualDraft>(field: K, value: TextVisualDraft[K]) => {
      const current = editorKey
        ? editSessionsDataStore.get<TextVisualDraft>(editorKey)?.draft
        : null;
      if (!current) return;
      setStoreDraft({ ...current, [field]: value });
    },
    [editorKey, setStoreDraft],
  );

  const session: TextVisualEditorSession = {
    textVisuals,
    screenMode,
    draft,
    isLoading,
    isSaving,
    setDraftField,
    selectItem,
    createNew,
    back,
    save,
    deleteItem,
  };

  return (
    <TextVisualEditorSessionContext.Provider value={session}>
      {children}
    </TextVisualEditorSessionContext.Provider>
  );
}
