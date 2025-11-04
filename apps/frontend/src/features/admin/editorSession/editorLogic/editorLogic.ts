import { ArtGerm, ArtItem } from '@/entities/art';
import { ISODate } from '@/entities/common';
import { generateArtId } from '@/features/admin/editorSession/editorLogic/generateArtId';
import type { FormValues } from '@/features/admin/editorSession/editorTypes';

export function prepareEditorForm(unit: ArtGerm): FormValues {
    if (unit.mode === 'create') {
        return {
            id: generateArtId() as string,
            dateCreated: todayISO() as ISODate,
            title: undefined,
            technique: undefined,
            availability: undefined,
            dimensions: undefined,
            price: undefined,
            alt: undefined,
            series: undefined,
            tags: undefined,
            notes: undefined,
        };
    } else {
        const item = unit.item as ArtItem;
        return {
            id: item.id,
            dateCreated: item.dateCreated,
            title: item.title,
            technique: item.techniques?.[0],
            availability: item.availability,
            dimensions: item.dimensions,
            price: item.price,
            alt: item.alt,
            series: item.series,
            tags: item.tags,
            notes: item.notes,
        };
    }
}

export function todayISO(): ISODate {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}` as ISODate;
}
