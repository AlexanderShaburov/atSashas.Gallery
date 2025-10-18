import type { StreamData } from '@/entities/stream';
import { useEffect, useState } from 'react';

function getStreamUrl(slug: string): string {
    const streamsPath = import.meta.env.VITE_STREAMS_BASE_URL;
    const url = `${streamsPath}${slug}.json`.replace(/\/\//g, '/');
    return url;
}

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
                const url = getStreamUrl(slug);
                if (!url) throw new Error('Unknown gallery slug');
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = (await res.json()) as StreamData;

                if (!cancelled) setStream(data);
            } catch (e: unknown) {
                if (!cancelled) {
                    if (
                        e &&
                        typeof e === 'object' &&
                        'message' in e &&
                        typeof e.message === 'string'
                    ) {
                        setError(e?.message ?? 'Load error');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [slug]);
    return { stream, loading, error };
}
