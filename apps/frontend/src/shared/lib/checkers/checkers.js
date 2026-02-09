// src/shared/lib/checkers/checkers.ts
export function normalizeForCompare(v) {
    if (Array.isArray(v)) {
        return v.map(normalizeForCompare);
    }
    if (v && typeof v === 'object') {
        const o = v;
        const sorted = {};
        for (const k of Object.keys(o).sort()) {
            sorted[k] = normalizeForCompare(o[k]);
        }
        return sorted;
    }
    return v;
}
export function deepEqual(a, b) {
    console.log('deepEqual got called.');
    try {
        return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
    }
    catch {
        // fallback (very rare)
        console.log('deepEqual fallback');
        return a === b;
    }
}
