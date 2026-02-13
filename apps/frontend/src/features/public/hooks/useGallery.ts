import type { StreamData } from '@/entities/stream';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Hook to load a single stream for public gallery page
 * Uses the API endpoint for consistency with usePublicStream
 */
export function useGallery(slug: string) {
    const [stream, setStream] = useState<StreamData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                // Load stream via API (consistent with usePublicStream)
                const url = `${API_BASE}/admin/streams/${slug}`;
                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(`Failed to load stream: ${res.status}`);
                }

                const data = await res.json();

                if (!cancelled) {
                    setStream(data);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    const message =
                        e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
                            ? e.message
                            : 'Failed to load gallery';
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
    }, [slug]);

    return { stream, loading, error };
}
