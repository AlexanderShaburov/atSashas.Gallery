// features/public/hooks/usePublicStream.ts

import type { StreamIndexItem } from '@/entities/stream';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Hook to load published streams for public gallery.
 * Supports preview mode: when URL has ?preview=true, reads draft data
 * from sessionStorage instead of the API (no changes to the live site).
 */
export function usePublicStream() {
    const [streams, setStreams] = useState<StreamIndexItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        let cancelled = false;

        // Check for preview mode
        const params = new URLSearchParams(window.location.search);
        if (params.get('preview') === 'true') {
            try {
                const raw = localStorage.getItem('__preview_streams');
                localStorage.removeItem('__preview_streams');
                if (raw) {
                    const previewStreams: StreamIndexItem[] = JSON.parse(raw);
                    if (!cancelled) {
                        setStreams(previewStreams);
                        setIsPreview(true);
                    }
                }
            } catch {
                // Fall through to normal load if preview data is invalid
            } finally {
                if (!cancelled) setLoading(false);
            }
            return () => {
                cancelled = true;
            };
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`${API_BASE}/public/streams/published`);
                if (!res.ok) {
                    throw new Error(`Failed to load published streams: ${res.status}`);
                }
                const publishedStreams: StreamIndexItem[] = await res.json();

                if (!cancelled) {
                    setStreams(publishedStreams);
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
    }, []);

    return { streams, loading, error, isPreview };
}
