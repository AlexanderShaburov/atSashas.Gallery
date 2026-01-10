import { EditorTarget, ISODate } from '@/entities/common';
import type { ArtItemForm } from '@/features/admin/catalogEditor/editorSession/editorTypes';
import { todayISO } from '@/shared/lib/dateAndLabels/Today';
import { generateId } from '@/shared/lib/id/generateId';

export function prepareEditorForm(unit: EditorTarget): ArtItemForm {
    switch (unit.mode) {
        case 'create':
            return {
                id: generateId('art') as string,
                dateCreated: todayISO() as ISODate,
                title: undefined,
                techniques: undefined,
                availability: undefined,
                dimensions: undefined,
                price: undefined,
                alt: undefined,
                series: undefined,
                tags: undefined,
                notes: undefined,
            };
        case 'edit':
            return {
                id: unit.item.id,
                dateCreated: unit.item.dateCreated,
                title: unit.item.title,
                techniques: unit.item.techniques,
                availability: unit.item.availability,
                dimensions: unit.item.dimensions,
                price: unit.item.price,
                alt: unit.item.alt,
                series: unit.item.series,
                tags: unit.item.tags,
                notes: unit.item.notes,
            };
    }
}
