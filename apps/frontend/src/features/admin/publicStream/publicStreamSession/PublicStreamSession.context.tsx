// features/admin/publicStream/publicStreamSession/PublicStreamSession.context.tsx

import type { PublicStreamData } from '@/entities/publicStream';
import type { StreamIndexItem } from '@/entities/stream';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicStreamApi } from '../api/publicStreamApi';
import type { PublicStreamSession } from './publicStreamSession.types';

const PublicStreamSessionContext = createContext<PublicStreamSession | undefined>(undefined);

export function usePublicStreamSession(): PublicStreamSession {
    const ctx = useContext(PublicStreamSessionContext);
    if (!ctx) {
        throw new Error('usePublicStreamSession must be used within PublicStreamSessionProvider');
    }
    return ctx;
}

type Props = {
    children: React.ReactNode;
};

export function PublicStreamSessionProvider({ children }: Props) {
    const gCtx = useEditorWorkspace();
    const navigate = useNavigate();

    const [publicStream, setPublicStream] = useState<PublicStreamData | null>(null);
    const [draft, setDraft] = useState<PublicStreamData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Load PublicStream on mount
    useEffect(() => {
        void (async () => {
            try {
                console.log('[PublicStreamSession]: Loading PublicStream...');
                setIsLoading(true);
                const data = await publicStreamApi.get();
                console.log('[PublicStreamSession]: PublicStream loaded:', data);
                setPublicStream(data);
                setDraft(data);
            } catch (err) {
                console.error('[PublicStreamSession]: Failed to load PublicStream', err);
                alert(`Failed to load PublicStream: ${err}`);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Calculate isDirty
    const isDirty =
        draft &&
        publicStream &&
        JSON.stringify(draft.streamIds) !== JSON.stringify(publicStream.streamIds);

    // Get available streams (filtered by status: ready or published)
    const availableStreams = (gCtx.streamsIndex || []).filter(
        (s) => s.status === 'ready' || s.status === 'published',
    );

    console.log('[PublicStreamSession]: Available streams:', availableStreams);
    console.log('[PublicStreamSession]: PublicStream streamIds:', draft?.streamIds);

    /** Add stream to draft */
    const addStream = useCallback(
        (streamId: string) => {
            if (!draft) return;
            if (draft.streamIds.includes(streamId)) return;
            setDraft({ ...draft, streamIds: [...draft.streamIds, streamId] });
        },
        [draft],
    );

    /** Remove stream from draft */
    const removeStream = useCallback(
        (streamId: string) => {
            if (!draft) return;
            setDraft({ ...draft, streamIds: draft.streamIds.filter((id) => id !== streamId) });
        },
        [draft],
    );

    /** Reorder streams in draft */
    const reorderStreams = useCallback(
        (streamIds: string[]) => {
            if (!draft) return;
            setDraft({ ...draft, streamIds: [...streamIds] });
        },
        [draft],
    );

    /** Save all draft changes with confirmation */
    const save = useCallback(async () => {
        if (!draft) return;
        if (!confirm('Apply changes to the public site?')) return;

        try {
            setIsSaving(true);
            const saved = await publicStreamApi.update(draft);
            setPublicStream(saved);
            setDraft(saved);
            console.log('[PublicStreamSession]: Saved successfully');
        } catch (err) {
            console.error('[PublicStreamSession]: Save failed', err);
            alert(`Failed to save: ${err}`);
        } finally {
            setIsSaving(false);
        }
    }, [draft]);

    /** Discard changes */
    const discard = useCallback(() => {
        if (publicStream) {
            setDraft(publicStream);
        }
    }, [publicStream]);

    /** Navigate to stream editor */
    const editStream = useCallback(
        (streamId: string) => {
            navigate(`/admin/streams?edit=${streamId}`);
        },
        [navigate],
    );

    /** Exit PublicStream editor */
    const exit = useCallback(() => {
        navigate('/admin');
    }, [navigate]);

    /** Toggle stream selection */
    const toggleSelection = useCallback((streamId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(streamId)) {
                next.delete(streamId);
            } else {
                next.add(streamId);
            }
            return next;
        });
    }, []);

    /** Select all available streams */
    const selectAll = useCallback(() => {
        const allIds = new Set(availableStreams.map((s) => s.streamId));
        setSelectedIds(allIds);
    }, [availableStreams]);

    /** Deselect all streams */
    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    /** Batch publish selected streams (draft only) */
    const publishSelected = useCallback(() => {
        if (!draft || selectedIds.size === 0) return;
        const currentIds = new Set(draft.streamIds);
        selectedIds.forEach((id) => currentIds.add(id));
        setDraft({ ...draft, streamIds: [...currentIds] });
        setSelectedIds(new Set());
    }, [draft, selectedIds]);

    /** Batch unpublish selected streams (draft only) */
    const unpublishSelected = useCallback(() => {
        if (!draft || selectedIds.size === 0) return;
        const remaining = draft.streamIds.filter((id) => !selectedIds.has(id));
        setDraft({ ...draft, streamIds: remaining });
        setSelectedIds(new Set());
    }, [draft, selectedIds]);

    const session: PublicStreamSession = {
        publicStream: draft,
        availableStreams,
        isLoading,
        isSaving,
        isDirty: !!isDirty,
        selectedIds,
        addStream,
        removeStream,
        reorderStreams,
        save,
        discard,
        editStream,
        exit,
        toggleSelection,
        selectAll,
        deselectAll,
        publishSelected,
        unpublishSelected,
    };

    return (
        <PublicStreamSessionContext.Provider value={session}>
            {children}
        </PublicStreamSessionContext.Provider>
    );
}
