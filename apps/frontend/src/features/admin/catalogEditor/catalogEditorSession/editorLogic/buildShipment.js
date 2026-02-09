export function buildShipment(target, clean) {
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
    return shipment;
}
