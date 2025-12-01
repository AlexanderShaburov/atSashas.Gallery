import type { BlocksCollectionJSON, CollectionsList } from '@/entities/block';
import { generateArtId } from '@/shared/lib/id/generateArtId';

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const BLOCK_VAULT = `${API_BASE}/block`;
export const BLOCK_COLLECTIONS_CONTENT = `${BLOCK_VAULT}/content`;
export const BLOCK_COLLECTION = `${BLOCK_VAULT}/collection`;
const BLOCK_NEW_COLLECTION = `${BLOCK_VAULT}/new_collection`;

export async function getCollectionsList(): Promise<CollectionsList> {
    const resp = await fetch(BLOCK_COLLECTIONS_CONTENT);
    if (!resp.ok)
        throw new Error(`Block Collections list request failed with error ${resp.status}`);
    const list = await resp.json();
    console.dir(`[getCollectionsList] received object: ${list}`);
    return await list;
}

export async function getCollection(id: string): Promise<BlocksCollectionJSON | undefined> {
    const resp = await fetch(`${BLOCK_COLLECTION}/${id}`);
    console.dir(resp);
    if (!resp.ok) throw new Error(`Failed to read ${id} collection`);
    return await resp.json();
}

export async function createCollection(name: string) {
    const collectionId = generateArtId('collection');
    console.log(`CreateCollection name: ${name}`);
    console.log(`CreateCollection id: ${collectionId}`);
    const data = {
        name: name,
        id: collectionId,
    };
    console.dir('CreateCollection:', data);
    const resp = await fetch(BLOCK_NEW_COLLECTION, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`Failed to create new collection ${name}`);
    return await resp.json();
}
