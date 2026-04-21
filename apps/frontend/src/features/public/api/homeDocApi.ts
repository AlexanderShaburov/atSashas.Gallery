// features/public/api/homeDocApi.ts

import type { HomeDoc } from '@/entities/homeDoc';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch HomeDoc for public rendering.
 */
export async function getPublicHomeDoc(): Promise<HomeDoc> {
    const res = await fetch(`${API_BASE}/public/home`);
    if (!res.ok) throw new Error(`Failed to load home doc: ${res.status}`);
    // Defensive: surface misconfigured responses (HTML/SPA fallback) with a
    // legible error instead of a cryptic JSON parse SyntaxError.
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        const snippet = (await res.text()).slice(0, 200);
        throw new Error(
            `/public/home returned non-JSON (${contentType || 'unknown'}): ${snippet}`,
        );
    }
    return res.json();
}
