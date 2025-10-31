import { CreateFormValues } from '@/features/admin/ui/CreateForm/CreateForm';

// ── Validation helpers (top-level) ───────────────────────────────────────────
export function hasAnyTitle(v?: CreateFormValues['title']): boolean {
    if (!v) return false;
    return Object.values(v).some((s) => (s ?? '').trim().length > 0);
}

export function validDimensions(d?: CreateFormValues['dimensions']): boolean {
    if (!d) return false;
    // Allow integers/floats; require strictly positive
    const w = Number(d.width);
    const h = Number(d.height);
    return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && !!d.unit;
}

export function validateCreateForm(values: CreateFormValues | null): boolean {
    if (!values) return false;

    const okId = typeof values.id === 'string' && values.id.trim().length > 0;
    const okDate =
        typeof values.dateCreated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(values.dateCreated);
    const okTechnique = typeof values.technique === 'string' && values.technique.trim().length > 0;
    const okAvailability = !!values.availability;
    const okTitleOrAlt = hasAnyTitle(values.title) || hasAnyTitle(values.alt);
    const okDims = validDimensions(values.dimensions);

    return okId && okDate && okTechnique && okAvailability && okTitleOrAlt && okDims;
}
