import type { BlocksCollectionJSON, CollectionsList } from '@/entities/block';

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const BLOCK_VAULT = `${API_BASE}/block`;
export const BLOCK_COLLECTIONS_CONTENT = `${BLOCK_VAULT}/content`;
export const BLOCK_COLLECTION = `${BLOCK_VAULT}/collection`;

export async function getCollectionsList(): Promise<CollectionsList> {
    const resp = await fetch(BLOCK_COLLECTIONS_CONTENT);
    if (!resp.ok)
        throw new Error(`Block Collections list request failed with error ${resp.status}`);
    return await resp.json();
}

export async function getCollection(id: string): Promise<BlocksCollectionJSON | undefined> {
    const resp = await fetch(`${BLOCK_COLLECTION}/${id}`);
    if (!resp.ok) throw new Error(`Failed to read ${id} collection`);
    return await resp.json();
}

export async function createCollection(name: string) {
    return { name: name };
}
