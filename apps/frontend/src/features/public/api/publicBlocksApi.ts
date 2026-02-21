import type { Block } from '@/entities/block';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch blocks for a published stream (public endpoint, no auth required).
 * Returns a dict of {blockId: Block}.
 */
export async function getPublicBlocks(streamId: string): Promise<Record<string, Block>> {
    const url = `${API_BASE}/public/blocks?stream_id=${encodeURIComponent(streamId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load blocks: ${res.status}`);
    return res.json();
}
