// features/admin/publicStream/api/publicStreamApi.ts

import type { PublicStreamData } from '@/entities/publicStream';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * PublicStream API client
 */
export const publicStreamApi = {
    /**
     * Get current PublicStream
     */
    async get(): Promise<PublicStreamData> {
        const response = await fetch(`${API_BASE}/admin/public_stream`);
        if (!response.ok) {
            throw new Error(`Failed to get PublicStream: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Full replace update of PublicStream
     */
    async update(publicStream: PublicStreamData): Promise<PublicStreamData> {
        const response = await fetch(`${API_BASE}/admin/public_stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(publicStream),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update PublicStream: ${error}`);
        }
        return response.json();
    },

    /**
     * Add a stream to PublicStream
     */
    async addStream(streamId: string): Promise<PublicStreamData> {
        const response = await fetch(`${API_BASE}/admin/public_stream/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamId }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to add stream: ${error}`);
        }
        return response.json();
    },

    /**
     * Remove a stream from PublicStream
     */
    async removeStream(streamId: string): Promise<PublicStreamData> {
        const response = await fetch(`${API_BASE}/admin/public_stream/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamId }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to remove stream: ${error}`);
        }
        return response.json();
    },

    /**
     * Reorder streams in PublicStream
     */
    async reorder(streamIds: string[]): Promise<PublicStreamData> {
        const response = await fetch(`${API_BASE}/admin/public_stream/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamIds }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to reorder streams: ${error}`);
        }
        return response.json();
    },
};
