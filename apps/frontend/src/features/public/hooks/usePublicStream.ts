// features/public/hooks/usePublicStream.ts

import type { PublicStreamData } from '@/entities/publicStream';
import type { StreamData } from '@/entities/stream';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Hook to load PublicStream and its streams for public gallery
 */
export function usePublicStream() {
    const [publicStream, setPublicStream] = useState<PublicStreamData | null>(null);
    const [streams, setStreams] = useState<StreamData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                // Load PublicStream
                const psRes = await fetch(`${API_BASE}/public/public_stream`);
                if (!psRes.ok) {
                    throw new Error(`Failed to load PublicStream: ${psRes.status}`);
                }
                const psData: PublicStreamData = await psRes.json();

                if (cancelled) return;
                setPublicStream(psData);

                // Load each stream via API
                const streamPromises = psData.streamIds.map(async (id) => {
                    try {
                        const url = `${API_BASE}/admin/streams/${id}`;
                        const res = await fetch(url);
                        if (!res.ok) {
                            console.warn(`Failed to load stream ${id}: ${res.status}`);
                            return null;
                        }
                        return (await res.json()) as StreamData;
                    } catch (err) {
                        console.warn(`Error loading stream ${id}:`, err);
                        return null;
                    }
                });

                const loadedStreams = await Promise.all(streamPromises);

                // Filter out null (failed loads) and preserve order
                const validStreams = loadedStreams.filter(
                    (s): s is StreamData => s !== null,
                );

                if (!cancelled) {
                    setStreams(validStreams);
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

    return { publicStream, streams, loading, error };
}
