import { ArtShipment } from '@/entities/art/shipment';
import { EditorTarget } from '@/entities/common';
import { ArtItemForm } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.types/editorTypes';

export function buildShipment(target: EditorTarget, clean: ArtItemForm): ArtShipment {
    let shipment = undefined;

    switch (target.mode) {
        case 'edit': {
            shipment = {
                ...clean,
                images: {
                    kind: 'ready',
                    image: target.item.images,
                },
            };
            break;
        }
        case 'create': {
            shipment = {
                ...clean,
                images: {
                    kind: 'hopper',
                    hopperSrc: target.item.thumbUrl,
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
