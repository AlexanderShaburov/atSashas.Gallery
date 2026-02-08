import { ArtItemData } from '@/entities/art';
import { ArtShipment } from '@/entities/art/shipment';
import { EditorTarget, ISODate } from '@/entities/common';
import type { ArtItemForm } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.types/editorTypes';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { generateId } from '@/shared/lib/id/generateId';

const EMPTY_FORM_TAIL = {
    title: undefined,
    techniques: undefined,
    availability: undefined,
    dimensions: undefined,
    price: undefined,
    alt: undefined,
    series: undefined,
    tags: undefined,
    notes: undefined,
} satisfies Omit<ArtItemForm, 'id' | 'dateCreated'>;
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
export const editorFormConvertor = (draft: ArtItemData): ArtItemForm => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, id, dateCreated, ...rest } = draft;
    return {
        ...EMPTY_FORM_TAIL,
        id: draft.id,
        dateCreated: draft.dateCreated,
        ...rest,
    };
};

export const draftToShipmentConvertor = (draft: ArtItemData): ArtShipment => {
    const { images, ...rest } = draft;
    return {
        ...EMPTY_FORM_TAIL,
        images: { kind: 'ready', image: images },
        ...rest,
    };
};
