// features/admin/publicStream/publicStreamSession/PublicStreamSession.context.tsx

import { PublicStream, type PublicStreamData } from '@/entities/publicStream';
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

    // Load PublicStream on mount
    useEffect(() => {
        void (async () => {
            try {
                setIsLoading(true);
                const data = await publicStreamApi.get();
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

    /** Add stream to draft */
    const addStream = useCallback(
        (streamId: string) => {
            if (!draft) return;

            const entity = PublicStream.fromJSON(draft);
            const updated = entity.addStream(streamId);
            setDraft(updated.toJSON());
        },
        [draft],
    );

    /** Remove stream from draft */
    const removeStream = useCallback(
        (streamId: string) => {
            if (!draft) return;

            const entity = PublicStream.fromJSON(draft);
            const updated = entity.removeStream(streamId);
            setDraft(updated.toJSON());
        },
        [draft],
    );

    /** Reorder streams in draft */
    const reorderStreams = useCallback(
        (streamIds: string[]) => {
            if (!draft) return;

            try {
                const entity = PublicStream.fromJSON(draft);
                const updated = entity.reorder(streamIds);
                setDraft(updated.toJSON());
            } catch (err) {
                console.error('[PublicStreamSession]: Reorder failed', err);
                alert(`Reorder failed: ${err}`);
            }
        },
        [draft],
    );

    /** Save changes */
    const save = useCallback(async () => {
        if (!draft) return;

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

    const session: PublicStreamSession = {
        publicStream: draft,
        availableStreams,
        isLoading,
        isSaving,
        isDirty: !!isDirty,
        addStream,
        removeStream,
        reorderStreams,
        save,
        discard,
        editStream,
        exit,
    };

    return (
        <PublicStreamSessionContext.Provider value={session}>
            {children}
        </PublicStreamSessionContext.Provider>
    );
}
