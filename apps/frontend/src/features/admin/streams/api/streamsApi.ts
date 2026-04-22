// src/shared/api/streamsApi.ts
import type { StreamData, StreamIndexItem } from '@/entities/stream/';
import { StreamMetadata } from '@/entities/stream/streamApi.types';
import { streamsIndexStore } from '@/shared/state/domain';

// Fallback matches `apps/frontend/.env` so a server build that does not
// substitute VITE_API_BASE_URL produces `/api/...` (relative) rather than
// `undefined/...` (which WebKit/Safari rejects as "The string did not
// match the expected pattern"). Same pattern every other API module uses.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }

    return (await res.json()) as T;
}

export const streamsApi = {
    list: (params?: { status?: string; tag?: string; q?: string }) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set('status', params.status);
        if (params?.tag) qs.set('tag', params.tag);
        if (params?.q) qs.set('q', params.q);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return http<StreamIndexItem[]>(`/admin/streams${suffix}`);
    },

    create: (body: StreamMetadata) =>
        http<StreamData>(`/admin/streams`, { method: 'POST', body: JSON.stringify(body) }),

    get: (streamId: string) => http<StreamData>(`/admin/streams/${encodeURIComponent(streamId)}`),

    update: (stream: StreamData) =>
        http<StreamData>(`/admin/streams/${encodeURIComponent(stream.streamId)}`, {
            method: 'PUT',
            body: JSON.stringify(stream),
        }),

    checkDependencies: (streamId: string) =>
        http<{
            streamId: string;
            isOnHomepage: boolean;
            dependencies: { homepage: boolean };
        }>(`/admin/streams/${encodeURIComponent(streamId)}/dependencies`),

    remove: (streamId: string, hard = false) => {
        console.log(`[streamsApi][remove] called with id: ${streamId}`);
        const suffix = hard ? `?hard=true` : '';
        return http<{ ok: true }>(`/admin/streams/${encodeURIComponent(streamId)}${suffix}`, {
            method: 'DELETE',
        });
    },
};

/** Fetch streams index from API and write to external store */
export async function refreshStreamsIndex(): Promise<void> {
    try {
        const index = await streamsApi.list();
        streamsIndexStore.set(index);
    } catch (error) {
        console.error('Failed to refresh streams index:', error);
    }
}
