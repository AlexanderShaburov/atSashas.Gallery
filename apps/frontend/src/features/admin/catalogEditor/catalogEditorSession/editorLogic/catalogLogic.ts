import type { ArtCatalog } from '@/entities/catalog';
import type { ArtItemData } from '@/entities/art';
// Types you likely already have:
type ItemId = string;

// 1) Upsert a full item (create or replace) and keep order consistent
export function upsertCatalogItem(
    catalog: ArtCatalog,
    item: ArtItemData,
    opts: { position?: 'append' | 'prepend' | number } = { position: 'prepend' }, // optional placement when inserting new
): ArtCatalog {
    const exists = !!catalog.items?.[item.id];

    // Update items map immutably
    const nextItems = { ...catalog.items, [item.id]: item };

    // Maintain order: if exists -> keep order as is; if new -> insert by rule
    let nextOrder = catalog.order;
    if (!exists) {
        if (opts?.position === 'prepend') {
            nextOrder = [item.id, ...catalog.order];
        } else if (typeof opts?.position === 'number' && isFinite(opts.position)) {
            const pos = Math.min(Math.max(0, opts.position), catalog.order.length);
            nextOrder = [...catalog.order.slice(0, pos), item.id, ...catalog.order.slice(pos)];
        } else {
            nextOrder = [...catalog.order, item.id]; // default append
        }
    }

    // Do NOT bump version/updatedAt on the client; the server will return final values
    return {
        ...catalog,
        items: nextItems,
        order: nextOrder,
    };
}

// 2) Patch only specific fields of an existing item by id
export function patchCatalogItem(
    catalog: ArtCatalog,
    id: ItemId,
    patch: Partial<ArtItemData>,
): ArtCatalog {
    const current = catalog.items[id];
    if (!current) {
        throw new Error(`Item ${id} not found`);
    }
    const nextItem: ArtItemData = { ...current, ...patch };
    return {
        ...catalog,
        items: { ...catalog.items, [id]: nextItem },
        // order stays unchanged
    };
}

// 3) Utility: upsert by id with a builder (handy in forms)
export function upsertWith(
    catalog: ArtCatalog,
    id: ItemId,
    build: (prev: ArtItemData | undefined) => ArtItemData,
    opts?: { position?: 'append' | 'prepend' | number },
): ArtCatalog {
    const next = build(catalog.items[id]);
    if (next.id !== id) {
        throw new Error(`Builder must keep id = ${id}`);
    }
    return upsertCatalogItem(catalog, next, opts);
}
