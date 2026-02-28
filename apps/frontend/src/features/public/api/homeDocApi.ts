// features/public/api/homeDocApi.ts

import type { HomeDoc } from '@/entities/homeDoc';
import type { Block } from '@/entities/block';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch HomeDoc for public rendering.
 * Falls back to migrated public_stream.json on the backend.
 */
export async function getPublicHomeDoc(): Promise<HomeDoc> {
    const res = await fetch(`${API_BASE}/public/home`);
    if (!res.ok) throw new Error(`Failed to load home doc: ${res.status}`);
    return res.json();
}

/**
 * Fetch blocks by their IDs (for block tiles on the Home page).
 * Returns a dict of {blockId: Block}.
 */
export async function getPublicBlocksByIds(ids: string[]): Promise<Record<string, Block>> {
    if (ids.length === 0) return {};
    const url = `${API_BASE}/public/blocks/by-ids?ids=${encodeURIComponent(ids.join(','))}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load blocks by ids: ${res.status}`);
    return res.json();
}
