// features/public/hooks/usePublicStream.ts

import type { StreamIndexItem } from '@/entities/stream';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Hook to load published streams for public/preview gallery index.
 *
 * - public mode: fetches published streams from public API (no auth).
 * - preview mode: reads draft stream IDs from localStorage (set by the
 *   PublicStreamEditor Preview button), then fetches the full stream index
 *   from the admin API (requires auth) to resolve titles/thumbnails.
 *   This lets the admin preview draft ordering WITHOUT saving changes.
 */
export function usePublicStream(mode: 'public' | 'preview' = 'public') {
    const [streams, setStreams] = useState<StreamIndexItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadPublic(): Promise<StreamIndexItem[]> {
            const res = await fetch(`${API_BASE}/public/streams/published`);
            if (!res.ok) {
                throw new Error(`Failed to load published streams: ${res.status}`);
            }
            return res.json();
        }

        async function loadPreview(): Promise<StreamIndexItem[]> {
            // Read draft stream IDs from localStorage (set by Preview button)
            const raw = localStorage.getItem('__preview_stream_ids');
            if (!raw) {
                // No draft data — fall back to published streams
                return loadPublic();
            }

            const draftIds: string[] = JSON.parse(raw);
            if (draftIds.length === 0) return [];

            // Fetch all streams from admin API (requires auth, available in PreviewRoot)
            const res = await fetch(`${API_BASE}/admin/streams`);
            if (!res.ok) {
                throw new Error(`Failed to load streams for preview: ${res.status}`);
            }
            const allStreams: StreamIndexItem[] = await res.json();

            // Filter and order by draft IDs
            const streamMap = new Map(allStreams.map((s) => [s.streamId, s]));
            return draftIds
                .map((id) => streamMap.get(id))
                .filter((s): s is StreamIndexItem => s !== undefined);
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const result = mode === 'preview' ? await loadPreview() : await loadPublic();

                if (!cancelled) {
                    setStreams(result);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    const message =
                        e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
                            ? e.message
                            : 'Failed to load public gallery';
                    setError(message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [mode]);

    return { streams, loading, error, isPreview: mode === 'preview' };
}
