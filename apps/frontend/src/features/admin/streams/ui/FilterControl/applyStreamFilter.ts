// src/features/admin/streams/ui/FilterControl/applyStreamFilter.ts

import type { StreamIndexItem } from '@/entities/stream';
import type { StreamFilterState } from '@/features/admin/streams/ui/FilterControl/stream-filter.types';

function norm(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function toDateKey(isoLike?: string | null): string | undefined {
    // Accepts "YYYY-MM-DD" or full ISO "YYYY-MM-DDTHH:mm:ssZ"
    if (!isoLike) return undefined;
    const m = String(isoLike).match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : undefined;
}

export function applyStreamFilter(
    streams: StreamIndexItem[],
    filter: StreamFilterState,
): StreamIndexItem[] {
    const q = norm(filter.query ?? '');
    const selectedTags = new Set((filter.tags ?? []).map((t) => t.trim()).filter(Boolean));
    const status = filter.status ? String(filter.status) : undefined;

    const after = filter.updatedAfter ? String(filter.updatedAfter) : undefined; // YYYY-MM-DD
    const before = filter.updatedBefore ? String(filter.updatedBefore) : undefined; // YYYY-MM-DD

    return streams.filter((s) => {
        // Query match (title + description + id)
        if (q) {
            const hay = norm(`${s.streamId} ${s.title ?? ''} ${s.description ?? ''}`);
            if (!hay.includes(q)) return false;
        }

        // Tags: all selected tags must be present in stream tags
        if (selectedTags.size > 0) {
            const tset = new Set((s.tags ?? []).filter(Boolean) as string[]);
            for (const t of selectedTags) {
                if (!tset.has(t)) return false;
            }
        }

        // Status match (exact)
        if (status) {
            if (String(s.status ?? '') !== status) return false;
        }

        // Updated date range (lex compare works for YYYY-MM-DD)
        if (after || before) {
            const d = toDateKey(s.updatedAt);
            // If range is requested but stream has no date -> exclude
            if (!d) return false;

            if (after && d < after) return false;
            if (before && d > before) return false;
        }

        return true;
    });
}
