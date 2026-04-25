import { apiFetch } from "@/features/auth/apiFetch";
import type { ArtItemDependents, TechniquesJson } from '@/entities/art';
import { ArtShipment } from '@/entities/art/shipment';
import type { ArtCatalog } from '@/entities/catalog';
import type { ApiResponse } from '@/entities/common';
import type { GridItem } from '@/shared/ui/grid';
import type { StreamData } from '@/entities/stream';
import { catalogStore } from '@/shared/state/domain';
// Fallbacks match `apps/frontend/.env` so server builds that fail to
// substitute the Vite env variables do not produce "undefined/..." URLs
// (which WebKit/Safari rejects as "The string did not match the expected
// pattern"). Every other API module in this codebase uses the same
// pattern — see `features/public/api/*.ts`,
// `features/admin/blocks/api/blocksApi.ts`, and the fix previously
// applied to `shared/ArtCatalogProvider/ArtCatalogLoader.tsx`.
export const VAULT_BASE = import.meta.env.VITE_VAULT_BASE_URL || '/media';
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export const STREAMS_URL = import.meta.env.VITE_STREAMS_BASE_URL || '/media/streams';
export const UPDATE_ART_CATALOG = `${API_BASE}/art/catalog/update`;
export const HOPPER_LIST_URL = `${API_BASE}/hopper/content`;
export const HOPPER_DEL = `${API_BASE}/hopper`;
export const JSON_VAULT = `${API_BASE}/json`;
export const UPLOAD_URL = `${API_BASE}/upload`;

/** Fetch catalog from API and write to external store */
export async function refreshCatalog(): Promise<void> {
    try {
        const catalog = await getCatalog();
        catalogStore.set(catalog);
    } catch (error) {
        console.error('Failed to refresh catalog:', error);
    }
}

// Load current catalog version:
export async function getCatalog(): Promise<ArtCatalog> {
    const request = `${JSON_VAULT}/art_catalog`;
    const res = await apiFetch(request);
    if (!res.ok) throw new Error(`Catalog ${res.status}`);
    const raw = (await res.json()) as ApiResponse<ArtCatalog>;
    return raw.data;
}

export async function updateCatalog(shipment: ArtShipment): Promise<number> {
    console.log(`Shipment is sending to backend with type: ${shipment.images.kind}`);
    const res = await apiFetch(UPDATE_ART_CATALOG, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipment),
    });
    if (!res.ok) throw new Error(`Update catalog error: ${res.status}`);
    return res.status;
}

export async function getStreams() {
    return (await apiFetch(STREAMS_URL)).json();
}

export async function saveStreams(data: StreamData) {
    await apiFetch(STREAMS_URL, {
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
    return (
        await apiFetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                Authorization: 'change-me',
            },
            body: fd,
        })
    ).json();
}

export async function getHopperContent(): Promise<GridItem[]> {
    const resp = await apiFetch(HOPPER_LIST_URL);
    if (!resp.ok) throw new Error(`Hopper list request failed with error ${resp.status}`);
    return await resp.json();
}

export async function getTechniques(): Promise<TechniquesJson> {
    const request = `${JSON_VAULT}/techniques`;
    const res = await apiFetch(request);
    if (!res.ok) throw new Error(`Techniques ${res.status}`);
    const raw = (await res.json()) as ApiResponse<TechniquesJson>;
    return raw.data;
}

// Collect and provide available series:
export async function getSeriesOptionsCI(): Promise<string[]> {
    const cat = await getCatalog();
    const map = new Map<string, string>();

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

export async function deleteFromHopper(fileId: string): Promise<boolean> {
    try {
        const url = `${HOPPER_DEL}/${encodeURIComponent(fileId)}`;
        console.log(`Endpoint for delete hopper file url ${url}`);
        const response = await apiFetch(url, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            // console.error('Failed to delete hopper file:', response.status, await response.text());
            return false;
        }

        return true; // success
    } catch (err) {
        console.error('Network error while deleting hopper file:', err);
        return false;
    }
}

export async function getDependents(id: string) {
    if (!id) return { response: 'failed', reason: 'no id' };
    const request = `${API_BASE}/art/dependencies/${id}`;

    const response = await apiFetch(request);
    if (!response.ok) {
        console.error(`Failed to collect dependents while deleting art item: ${id}`);
        return { response: 'failed', reason: String(response) };
    }
    const raw = (await response.json()) as ApiResponse<ArtItemDependents>;
    return {
        response: 'ok',
        data: raw.data,
    };
}

/**
 * Delete an art item from the catalog
 */
export async function deleteArtItem(artId: string): Promise<void> {
    const url = `${API_BASE}/art/catalog/${encodeURIComponent(artId)}`;
    const response = await apiFetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to delete art item ${artId}: ${response.status} ${errorText}`);
    }
}
