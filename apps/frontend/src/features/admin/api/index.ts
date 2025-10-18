import type { ArtCatalog } from '@/entities/catalog';
import type { StreamData } from '@/entities/stream';

export const VAULT_BASE = import.meta.env.VITE_VAULT_BASE_URL;
export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const STREAMS_URL = import.meta.env.VITE_STREAMS_BASE_URL;
export const CATALOG_URL = `${VAULT_BASE}api/catalog.json`;
export const UPDATE_CATALOG = `${API_BASE}/catalog/update`;
export const HOPPER_LIST_URL = ` ${API_BASE}/hopper/content`;
// const VAULT_URL = `${BASE}api/vault/`;
export const UPLOAD_URL = `${API_BASE}upload`;
console.log(VAULT_BASE, API_BASE, STREAMS_URL, UPLOAD_URL);

export async function getCatalog() {
    return (await fetch(CATALOG_URL)).json();
}

export async function saveCatalog(data: ArtCatalog) {
    await fetch(CATALOG_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function getStreams() {
    return (await fetch(STREAMS_URL)).json();
}

export async function saveStreams(data: StreamData) {
    await fetch(STREAMS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function uploadImage(file: File, category: string, filename?: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    console.log(VAULT_BASE, API_BASE, STREAMS_URL, UPLOAD_URL);
    console.log(`Form for ${file.name} created ${fd} be created to ${UPLOAD_URL}`);
    console.log(`Where base is ${UPLOAD_URL}`);
    if (filename) fd.append('filename', filename);
    return (await fetch(UPLOAD_URL, { method: 'POST', body: fd })).json();
}
