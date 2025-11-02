import type { TechniquesJson } from '@/entities/art';
import type { ArtCatalog, Thumb } from '@/entities/catalog';
import type { ApiResponse } from '@/entities/common';
import type { StreamData } from '@/entities/stream';
export const VAULT_BASE = import.meta.env.VITE_VAULT_BASE_URL;
export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const STREAMS_URL = import.meta.env.VITE_STREAMS_BASE_URL;
export const UPDATE_CATALOG = `${API_BASE}/catalog/update`;
export const HOPPER_LIST_URL = ` ${API_BASE}/hopper/content`;
export const JSON_VAULT = `${API_BASE}/json`;
// const VAULT_URL = `${BASE}api/vault/`;
export const UPLOAD_URL = `${API_BASE}/upload`;
console.log(VAULT_BASE, API_BASE, STREAMS_URL, UPLOAD_URL);

// async function j<T>(res: Response): Promise<T> {
//     if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(`${res.status} ${res.statusText}: ${txt}`);
//     }
//     return res.json() as Promise<T>;
// }

export async function getCatalog(): Promise<ArtCatalog> {
    const request = `${JSON_VAULT}/catalog`;
    const res = await fetch(request);
    if (!res.ok) throw new Error(`Catalog ${res.status}`);
    const raw = (await res.json()) as ApiResponse<ArtCatalog>;
    return raw.data;
}

export async function saveCatalog(data: ArtCatalog) {
    const request = `${JSON_VAULT}/catalog`;
    await fetch(request, {
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
    if (filename) fd.append('filename', filename);
    return (await fetch(UPLOAD_URL, { method: 'POST', body: fd })).json();
}

export async function getHopperContent(): Promise<Thumb[]> {
    const resp = await fetch(HOPPER_LIST_URL);
    if (!resp.ok) throw new Error(`Hopper list request failed with error ${resp.status}`);
    return await resp.json();
}

export async function getTechniques(): Promise<TechniquesJson> {
    const request = `${JSON_VAULT}/techniques`;
    const res = await fetch(request);
    if (!res.ok) throw new Error(`Techniques ${res.status}`);
    const raw = (await res.json()) as ApiResponse<TechniquesJson>;
    return raw.data;
}

// Collect and provide available series:
export async function getSeriesOptionsCI(): Promise<string[]> {
    const cat = await getCatalog();
    const map = new Map<string, string>(); // key = lowercased, value = первая «нормальная» строка

    for (const id of cat.order ?? []) {
        const s = cat.items?.[id]?.series;
        if (typeof s === 'string') {
            const t = s.trim();
            if (!t) continue;
            const key = t.toLocaleLowerCase();
            if (!map.has(key)) map.set(key, t);
        }
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b));
}
