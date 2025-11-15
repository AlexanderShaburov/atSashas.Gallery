import { ArtGerm, ArtItem } from '@/entities/art';
import { FormValues } from '@/features/admin/editorSession/editorTypes';
import { ArtShipment } from '@/entities/art/shipment';
import { Thumb } from '@/entities/catalog';

export function buildShipment(idt: ArtGerm, clean: FormValues): ArtShipment {
    let shipment = undefined;
    switch (idt.mode) {
        case 'create': {
            const i = idt.item as ArtItem;
            shipment = {
                ...clean,
                images: {
                    kind: 'ready',
                    image: i.images,
                },
            };
            break;
        }
        case 'edit': {
            const t = idt.item as Thumb;
            shipment = {
                ...clean,
                images: {
                    kind: 'hopper',
                    hopperSrc: t.src,
                },
            };
            break;
        }
        default: {
            throw new Error('Function not implemented.');
            break;
        }
    }
    return shipment as ArtShipment;
}
