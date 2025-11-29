import type { BlocksCollectionJSON, CollectionsList } from '@/entities/block';

export const VAULT_BASE = import.meta.env.VITE_VAULT_BASE_URL;
export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const STREAMS_URL = import.meta.env.VITE_STREAMS_BASE_URL;
export const JSON_VAULT = `${API_BASE}/json`;
export const BLOCK_COLLECTIONS = `${JSON_VAULT}/block_collections`;

export async function getCollectionsList(): Promise<CollectionsList> {
    const resp = await fetch(BLOCK_COLLECTIONS);
    if (!resp.ok)
        throw new Error(`Block Collections list request failed with error ${resp.status}`);
    return await resp.json();
}

export async function getCollection(id: string): Promise<BlocksCollectionJSON | undefined> {
    const resp = await fetch(`${BLOCK_COLLECTIONS}/${id}`);
    if (!resp.ok) throw new Error(`Failed to read ${id} collection`);
    return await resp.json();
}
