// src/shared/api/streamsApi.ts
import type { StreamData, StreamIndexItem } from '@/entities/stream/';

export type CreateStreamRequest = {
    streamId: string;
    title: string;
    tags?: string[];
    description?: string;
};
const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

    create: (body: CreateStreamRequest) =>
        http<StreamData>(`/admin/streams`, { method: 'POST', body: JSON.stringify(body) }),

    get: (streamId: string) => http<StreamData>(`/admin/streams/${encodeURIComponent(streamId)}`),

    update: (stream: StreamData) =>
        http<StreamData>(`/admin/streams/${encodeURIComponent(stream.streamId)}`, {
            method: 'PUT',
            body: JSON.stringify(stream),
        }),

    remove: (streamId: string, hard = false) => {
        const suffix = hard ? `?hard=true` : '';
        return http<{ ok: true }>(`/admin/streams/${encodeURIComponent(streamId)}${suffix}`, {
            method: 'DELETE',
        });
    },
};
