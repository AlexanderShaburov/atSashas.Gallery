// features/public/hooks/useHomeFeed.ts

import type { EventPageData } from '@/entities/event';
import type { HomeDoc, HomeItem } from '@/entities/homeDoc';
import type { StreamIndexItem } from '@/entities/stream';
import { useEffect, useState } from 'react';
import { getEventPageById, loadEventPagesOnce } from '../api/eventPagesModule';
import { getPublicHomeDoc } from '../api/homeDocApi';
import { loadMediaItemsOnce } from '../api/mediaItemsModule';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export type HomeFeedResult = {
    homeDoc: HomeDoc | null;
    streams: Map<string, StreamIndexItem>;
    events: Map<string, EventPageData>;
    loading: boolean;
    error: string | null;
    isPreview: boolean;
};

/**
 * Loads HomeDoc and resolves all references:
 * - streamRef items → fetched from streams index
 * - eventRef items → resolved from eventPagesModule (loadEventPagesOnce gated page-level)
 *
 * Page-level loading gate: `loading` stays true until streams and eventPages
 * both resolve. HomePage short-circuits on `loading`, so event tiles never
 * render with a missing catalog.
 *
 * In preview mode, reads draft HomeDoc from localStorage and fetches data from admin API.
 */
export function useHomeFeed(mode: 'public' | 'preview' = 'public'): HomeFeedResult {
    const [homeDoc, setHomeDoc] = useState<HomeDoc | null>(null);
    const [streams, setStreams] = useState<Map<string, StreamIndexItem>>(new Map());
    const [events, setEvents] = useState<Map<string, EventPageData>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadPublic(): Promise<HomeDoc> {
            return getPublicHomeDoc();
        }

        async function loadPreview(): Promise<HomeDoc> {
            const raw = localStorage.getItem('__preview_home_doc');
            if (raw) {
                return JSON.parse(raw) as HomeDoc;
            }
            // No preview data — fall back to public
            return getPublicHomeDoc();
        }

        async function resolveStreams(
            items: HomeItem[],
            isAdmin: boolean,
        ): Promise<Map<string, StreamIndexItem>> {
            const streamIds = items
                .filter((it): it is Extract<HomeItem, { kind: 'streamRef' }> => it.kind === 'streamRef')
                .map((it) => it.streamId);

            if (streamIds.length === 0) return new Map();

            const url = isAdmin
                ? `${API_BASE}/admin/streams`
                : `${API_BASE}/public/streams/by-ids?ids=${encodeURIComponent(streamIds.join(','))}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to load streams: ${res.status}`);
            // Defensive Content-Type check — same rationale as resolveEvents.
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.toLowerCase().includes('application/json')) {
                const snippet = (await res.text()).slice(0, 200);
                console.warn(
                    '[useHomeFeed] streams endpoint returned non-JSON:',
                    { url, contentType, snippet },
                );
                return new Map();
            }
            const allStreams: StreamIndexItem[] = await res.json();

            const map = new Map<string, StreamIndexItem>();
            for (const s of allStreams) {
                if (streamIds.includes(s.streamId)) {
                    map.set(s.streamId, s);
                }
            }
            return map;
        }

        async function resolveEvents(
            items: HomeItem[],
            isAdmin: boolean,
        ): Promise<Map<string, EventPageData>> {
            const eventPageIds = items
                .filter((it): it is Extract<HomeItem, { kind: 'eventRef' }> => it.kind === 'eventRef')
                .map((it) => it.eventPageId);

            // Admin/preview: read the full admin catalog (drafts + scheduled).
            // This matches what the Homepage Editor sees, so preview faithfully
            // reflects what the author is about to publish.
            if (isAdmin) {
                let catalog: { pages: Record<string, EventPageData> } | null = null;
                try {
                    const res = await fetch(`${API_BASE}/admin/event-pages`);
                    if (!res.ok) {
                        console.warn(
                            '[useHomeFeed] admin event-pages HTTP',
                            res.status,
                            res.statusText,
                        );
                    } else {
                        // Defensive: if a misconfigured proxy returns HTML (e.g. login
                        // page or SPA fallback), surface it as a warning instead of a
                        // cryptic JSON parse error.
                        const contentType = res.headers.get('content-type') || '';
                        if (!contentType.toLowerCase().includes('application/json')) {
                            const snippet = (await res.text()).slice(0, 200);
                            console.warn(
                                '[useHomeFeed] admin event-pages returned non-JSON:',
                                { contentType, snippet },
                            );
                        } else {
                            catalog = await res.json();
                        }
                    }
                } catch (e) {
                    console.warn(
                        '[useHomeFeed] admin event-pages load failed; event tiles will be skipped:',
                        e,
                    );
                }
                if (!catalog || eventPageIds.length === 0) return new Map();
                const map = new Map<string, EventPageData>();
                for (const id of eventPageIds) {
                    const page = catalog.pages[id];
                    if (page) map.set(id, page);
                }
                return map;
            }

            // Public: status-filtered public endpoint via shared cache.
            try {
                await loadEventPagesOnce();
            } catch (e) {
                console.warn(
                    '[useHomeFeed] loadEventPagesOnce failed; event tiles will be skipped:',
                    e,
                );
                return new Map();
            }

            if (eventPageIds.length === 0) return new Map();

            const map = new Map<string, EventPageData>();
            for (const id of eventPageIds) {
                const page = getEventPageById(id);
                if (page) map.set(id, page);
            }
            return map;
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const isPreview = mode === 'preview';
                const doc = isPreview ? await loadPreview() : await loadPublic();

                if (cancelled) return;

                // Prime media items cache so event tiles (and other consumers)
                // can resolve heroImage refs synchronously via getMediaItem().
                // Non-fatal on failure; event tiles will fall back to text-only.
                const mediaItemsPromise = loadMediaItemsOnce().catch((e) => {
                    console.warn('[useHomeFeed] loadMediaItemsOnce failed:', e);
                });

                const [streamsMap, eventsMap] = await Promise.all([
                    resolveStreams(doc.items, isPreview),
                    resolveEvents(doc.items, isPreview),
                ]);
                await mediaItemsPromise;

                if (cancelled) return;

                setHomeDoc(doc);
                setStreams(streamsMap);
                setEvents(eventsMap);
            } catch (e: unknown) {
                if (!cancelled) {
                    const message =
                        e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
                            ? e.message
                            : 'Failed to load home feed';
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

    return { homeDoc, streams, events, loading, error, isPreview: mode === 'preview' };
}
