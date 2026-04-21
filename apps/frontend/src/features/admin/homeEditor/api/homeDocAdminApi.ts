// features/admin/homeEditor/api/homeDocAdminApi.ts
//
// Admin-side HomeDoc API. Owned by the Homepage Editor.

import type { HomeDoc } from '@/entities/homeDoc';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const homeDocAdminApi = {
    async get(): Promise<HomeDoc> {
        const res = await fetch(`${API_BASE}/admin/home`);
        if (!res.ok) throw new Error(`Failed to get HomeDoc: ${res.statusText}`);
        return res.json();
    },

    async update(doc: HomeDoc): Promise<HomeDoc> {
        const res = await fetch(`${API_BASE}/admin/home`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc),
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Failed to update HomeDoc: ${error}`);
        }
        return res.json();
    },
};
