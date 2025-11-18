import { ArtGerm, ArtItem } from '@/entities/art';
import { ArtShipment } from '@/entities/art/shipment';
import { Thumb } from '@/entities/catalog';
import { FormValues } from '@/features/admin/editorSession/editorTypes';

export function buildShipment(idt: ArtGerm, clean: FormValues): ArtShipment {
    let shipment = undefined;
    switch (idt.mode) {
        case 'edit': {
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
        case 'create': {
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
