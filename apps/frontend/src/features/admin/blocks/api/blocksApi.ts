//src/features/admin/blocks/api/blocksApi.ts:

import type { Block, BlocksCollectionJSON } from '@/entities/block';
import { generateId } from '@/shared/lib/id/generateId';

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const BLOCK_VAULT = `${API_BASE}/blocks`;
export const BLOCK_COLLECTIONS_CONTENT = `${BLOCK_VAULT}/content`;
export const BLOCK_COLLECTION = `${BLOCK_VAULT}/collection`;
const BLOCK_NEW_COLLECTION = `${BLOCK_VAULT}/new_collection`;

export async function getCollection(): Promise<BlocksCollectionJSON> {
    const resp = await fetch(BLOCK_COLLECTION);
    console.dir(resp);
    if (!resp.ok) throw new Error(`Failed to read collection`);
    return await resp.json();
}

export async function createCollection(name: string) {
    const collectionId = generateId('collection');
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

export async function deleteCollection(collection: BlocksCollectionJSON) {
    try {
        const url = BLOCK_COLLECTION + `/${collection.collectionId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to delete collection file: ' + collection.collectionName);
        }

        return true;
    } catch (err) {
        // console.error('Network error while deleting collection file: ', err);
        return false;
    }
}

export async function addNewBlock(block: Block): Promise<Block> {
    console.log(`[addNewBlock]: Called`);
    const res = await fetch(BLOCK_VAULT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(block),
    });
    if (!res.ok) throw new Error(`Add new block error: ${res.status}`);
    return await res.json();
}

export async function updateBlock(block: Block): Promise<Block> {
    console.log('[updateBlock]: Called');
    const URL = `${BLOCK_VAULT}/${block.id}`;
    const res = await fetch(URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block),
    });
    if (!res.ok) throw new Error(`Update block error: ${res.status}`);
    return await res.json();
}

export async function deleteBlock(id: string) {
    console.log(`[API][deleteBlock] block with id ${id} be deleted immediately`);
    const URL = `${BLOCK_VAULT}/${id}`;
    const res = await fetch(URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Delete block error: ${res.status}`);
    return res.status;
}
