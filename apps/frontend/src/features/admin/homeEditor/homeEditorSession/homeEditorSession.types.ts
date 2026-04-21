// features/admin/homeEditor/homeEditorSession/homeEditorSession.types.ts

import type { HomeDoc, HomeItem } from '@/entities/homeDoc';

/**
 * Control-plane surface of the Homepage Editor session.
 *
 * Data (draft/snapshot) lives in editSessionsDataStore keyed by
 * { kind: 'home', id: 'home-doc' }. This type exposes only the
 * user-facing actions and derived booleans.
 */
export type HomeEditorSession = {
    /** Current HomeDoc draft (null until first load). */
    homeDoc: HomeDoc | null;

    isLoading: boolean;
    isSaving: boolean;
    /** draft differs from snapshot. */
    isDirty: boolean;
    /** This editor is mid-journey (outbound or returning). */
    isJourney: boolean;

    // ── Composition actions ──

    /** Dispatch journey to stream editor (select mode) → returns with streamId. */
    addStreamViaJourney: () => void;
    /** Dispatch journey to eventPage editor (select mode) → returns with eventPageId. */
    addEventViaJourney: () => void;

    /** Open the stream backing the item at `index` in the stream editor (edit mode). */
    openStreamItem: (index: number) => void;
    /** Open the event page backing the item at `index` in the event-page editor (edit mode). */
    openEventItem: (index: number) => void;

    /** Remove item at index from draft. Local only until Save. */
    removeItem: (index: number) => void;
    /** Replace the draft item order. Local only until Save. */
    reorderItems: (items: HomeItem[]) => void;

    // ── Lifecycle ──

    /** PUT /api/admin/home. On success: commit. On error: keep draft. */
    save: () => Promise<void>;
    /** Revert draft to last committed snapshot. */
    discard: () => void;
    /** Stash draft in localStorage, open /preview in a new tab (full public homepage). */
    preview: () => void;
    /** Guarded navigation back to /admin. */
    exit: () => void;
};
