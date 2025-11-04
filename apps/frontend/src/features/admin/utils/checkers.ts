export function normalizeForCompare(v: unknown): unknown {
    if (Array.isArray(v)) {
        return v.map(normalizeForCompare);
    }
    if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const k of Object.keys(o).sort()) {
            sorted[k] = normalizeForCompare(o[k]);
        }
        return sorted;
    }
    return v;
}
export function deepEqual(a: unknown, b: unknown): boolean {
    console.log('deepEqual got called.');
    try {
        return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
    } catch {
        // fallback (very rare)
        console.log('deepEqual fallback');
        return a === b;
    }
}
