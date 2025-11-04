import { ArtGerm, ArtItem } from '@/entities/art';
import { Thumb } from '@/entities/catalog';
import { FormValues } from '@/features/admin/editorSession/editorTypes';

// ── Validation helpers (top-level) ───────────────────────────────────────────
export function hasAnyTitle(v?: FormValues['title']): boolean {
    if (!v) return false;
    return Object.values(v).some((s) => (s ?? '').trim().length > 0);
}

export function validDimensions(d?: FormValues['dimensions']): boolean {
    if (!d) return false;
    // Allow integers/floats; require strictly positive
    const w = Number(d.width);
    const h = Number(d.height);
    return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && !!d.unit;
}

// export function validateCreateForm(values: FormValues | null): boolean {
//     if (!values) return false;

//     const okId = typeof values.id === 'string' && values.id.trim().length > 0;
//     const okDate =
//         typeof values.dateCreated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(values.dateCreated);
//     const okTechnique = typeof values.techniques === 'string' && values.technique.trim().length > 0;
//     const okAvailability = !!values.availability;
//     const okTitleOrAlt = hasAnyTitle(values.title) || hasAnyTitle(values.alt);
//     const okDims = validDimensions(values.dimensions);

//     return okId && okDate && okTechnique && okAvailability && okTitleOrAlt && okDims;
// }
//min validity: ID + image presence (no mode)
export function isMinimalValid(form: FormValues | undefined, item: ArtGerm): boolean {
    const okId = typeof form?.id === 'string' && form.id.trim().length > 0;
    console.log('isMinimalValid: mode: create, okId is: ', okId);
    let okImage = false;
    switch (item.mode) {
        case 'create': {
            const thmb = item.item as Thumb;
            okImage = !!thmb.src;
            console.log('isMinimalValid: mode: create, okImage is: ', okImage);
            break;
        }
        case 'edit': {
            const itm = item.item as ArtItem;
            okImage = !!itm.images;
            break;
        }
        default:
            break;
    }

    return okId && okImage;
}

// Normalization. Now soft:
export function sanitizeForm(v: FormValues): FormValues {
    const s = { ...v };
    if (typeof s.id === 'string') s.id = s.id.trim();
    return s;
}
