import { EditorTarget } from '@/entities/common';
import { ArtItemForm } from '@/features/admin/catalogEditor/catalogEditorSession/editorTypes';

// ── Validation helpers (top-level) ───────────────────────────────────────────
export function hasAnyTitle(v?: ArtItemForm['title']): boolean {
    if (!v) return false;
    return Object.values(v).some((s) => (s ?? '').trim().length > 0);
}

export function validDimensions(d?: ArtItemForm['dimensions']): boolean {
    if (!d) return false;
    // Allow integers/floats; require strictly positive
    const w = Number(d.width);
    const h = Number(d.height);
    return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && !!d.unit;
}

// export function validateCreateForm(values: ArtItemForm | null): boolean {
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

export function isMinimalValid(form: ArtItemForm | undefined, item: EditorTarget): boolean {
    const okId = typeof form?.id === 'string' && form.id.trim().length > 0;
    console.log('isMinimalValid: mode: create, okId is: ', okId);
    let okImage = false;
    switch (item.mode) {
        case 'create': {
            okImage = !!item.item.thumbUrl;
            console.log('isMinimalValid: mode: create, okImage is: ', okImage);
            break;
        }
        case 'edit': {
            okImage = !!item.item.images;
            break;
        }
        default:
            break;
    }

    return okId && okImage;
}

// Normalization. Now soft:
export function sanitizeForm(v: ArtItemForm): ArtItemForm {
    const s = { ...v };
    if (typeof s.id === 'string') s.id = s.id.trim();
    return s;
}
