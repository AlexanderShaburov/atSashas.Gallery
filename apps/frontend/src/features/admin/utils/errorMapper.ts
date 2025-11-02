import { FormValues } from '@/features/admin/ui/CreateForm/CreateForm';

export type FormErrors = Partial<{
    id: string;
    dateCreated: string;
    technique: string;
    availability: string;
    'title.*': string; // at least one title.* or alt.* is required
    'alt.*': string; // same as above
    'dimensions.width': string;
    'dimensions.height': string;
    'dimensions.unit': string;
}>;

function hasAnyLocalized(v?: FormValues['title']): boolean {
    if (!v) return false;
    return Object.values(v).some((s) => (s ?? '').trim().length > 0);
}

export function validateErrors(values: FormValues | null): FormErrors {
    const e: FormErrors = {};
    if (!values) return e;

    if (!values.id?.trim()) e.id = 'Required';
    if (!values.dateCreated || !/^\d{4}-\d{2}-\d{2}$/.test(values.dateCreated))
        e.dateCreated = 'YYYY-MM-DD required';

    if (!values.technique?.trim()) e.technique = 'Required';
    if (!values.availability) e.availability = 'Required';

    const hasTitle = hasAnyLocalized(values.title);
    const hasAlt = hasAnyLocalized(values.alt);
    if (!hasTitle && !hasAlt) {
        e['title.*'] = 'Provide title or alt in any language';
        e['alt.*'] = 'Provide title or alt in any language';
    }

    const d = values.dimensions;
    const w = Number(d?.width);
    const h = Number(d?.height);
    if (!(Number.isFinite(w) && w > 0)) e['dimensions.width'] = 'Positive number';
    if (!(Number.isFinite(h) && h > 0)) e['dimensions.height'] = 'Positive number';
    if (!d?.unit) e['dimensions.unit'] = 'Required';

    return e;
}

export function isEmptyErrors(e: FormErrors): boolean {
    return Object.keys(e).length === 0;
}
