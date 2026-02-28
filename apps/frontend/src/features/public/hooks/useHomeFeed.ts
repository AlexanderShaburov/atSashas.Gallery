// features/public/hooks/useHomeFeed.ts

import type { Block } from '@/entities/block';
import type { HomeDoc, HomeItem } from '@/entities/homeDoc';
import type { StreamIndexItem } from '@/entities/stream';
import { useEffect, useState } from 'react';
import { getPublicBlocksByIds, getPublicHomeDoc } from '../api/homeDocApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export type HomeFeedResult = {
    homeDoc: HomeDoc | null;
    streams: Map<string, StreamIndexItem>;
    blocks: Map<string, Block>;
    loading: boolean;
    error: string | null;
    isPreview: boolean;
};

/**
 * Loads HomeDoc and resolves all references:
 * - streamRef items → fetched from streams index
 * - blockRef items → fetched from blocks-by-ids endpoint
 *
 * In preview mode, reads draft HomeDoc from localStorage
 * and fetches data from admin API.
 */
export function useHomeFeed(mode: 'public' | 'preview' = 'public'): HomeFeedResult {
    const [homeDoc, setHomeDoc] = useState<HomeDoc | null>(null);
    const [streams, setStreams] = useState<Map<string, StreamIndexItem>>(new Map());
    const [blocks, setBlocks] = useState<Map<string, Block>>(new Map());
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
            const slugs = items
                .filter((it): it is Extract<HomeItem, { kind: 'streamRef' }> => it.kind === 'streamRef')
                .map((it) => it.streamSlug);

            if (slugs.length === 0) return new Map();

            const url = isAdmin
                ? `${API_BASE}/admin/streams`
                : `${API_BASE}/public/streams/published`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to load streams: ${res.status}`);
            const allStreams: StreamIndexItem[] = await res.json();

            const map = new Map<string, StreamIndexItem>();
            for (const s of allStreams) {
                if (slugs.includes(s.streamId)) {
                    map.set(s.streamId, s);
                }
            }
            return map;
        }

        async function resolveBlocks(
            items: HomeItem[],
            isAdmin: boolean,
        ): Promise<Map<string, Block>> {
            const blockIds = items
                .filter((it): it is Extract<HomeItem, { kind: 'blockRef' }> => it.kind === 'blockRef')
                .map((it) => it.blockId);

            if (blockIds.length === 0) return new Map();

            // In preview/admin mode, fetch blocks from admin collection endpoint
            // to ensure unpublished blocks are available
            if (isAdmin) {
                try {
                    const res = await fetch(`${API_BASE}/blocks/collection`);
                    if (res.ok) {
                        const text = await res.text();
                        const collection = JSON.parse(text) as { blocks: Record<string, Block> };
                        const map = new Map<string, Block>();
                        for (const id of blockIds) {
                            const block = collection.blocks[id];
                            if (block) map.set(id, block);
                        }
                        console.log('[useHomeFeed] Resolved blocks via admin:', map.size);
                        return map;
                    }
                    console.warn('[useHomeFeed] Admin blocks fetch failed:', res.status);
                } catch (e) {
                    console.warn('[useHomeFeed] Admin blocks parse error, falling back:', e);
                }
                // Fallback to public endpoint
            }

            const dict = await getPublicBlocksByIds(blockIds);
            return new Map(Object.entries(dict));
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const isPreview = mode === 'preview';
                const doc = isPreview ? await loadPreview() : await loadPublic();

                if (cancelled) return;

                const [streamsMap, blocksMap] = await Promise.all([
                    resolveStreams(doc.items, isPreview),
                    resolveBlocks(doc.items, isPreview),
                ]);

                if (cancelled) return;

                setHomeDoc(doc);
                setStreams(streamsMap);
                setBlocks(blocksMap);
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

    return { homeDoc, streams, blocks, loading, error, isPreview: mode === 'preview' };
}
