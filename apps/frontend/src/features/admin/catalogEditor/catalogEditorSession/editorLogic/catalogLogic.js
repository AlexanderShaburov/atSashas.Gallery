// 1) Upsert a full item (create or replace) and keep order consistent
export function upsertCatalogItem(catalog, item, opts = { position: 'prepend' }) {
    const exists = !!catalog.items?.[item.id];
    // Update items map immutably
    const nextItems = { ...catalog.items, [item.id]: item };
    // Maintain order: if exists -> keep order as is; if new -> insert by rule
    let nextOrder = catalog.order;
    if (!exists) {
        if (opts?.position === 'prepend') {
            nextOrder = [item.id, ...catalog.order];
        }
        else if (typeof opts?.position === 'number' && isFinite(opts.position)) {
            const pos = Math.min(Math.max(0, opts.position), catalog.order.length);
            nextOrder = [...catalog.order.slice(0, pos), item.id, ...catalog.order.slice(pos)];
        }
        else {
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
export function patchCatalogItem(catalog, id, patch) {
    const current = catalog.items[id];
    if (!current) {
        throw new Error(`Item ${id} not found`);
    }
    const nextItem = { ...current, ...patch };
    return {
        ...catalog,
        items: { ...catalog.items, [id]: nextItem },
        // order stays unchanged
    };
}
// 3) Utility: upsert by id with a builder (handy in forms)
export function upsertWith(catalog, id, build, opts) {
    const next = build(catalog.items[id]);
    if (next.id !== id) {
        throw new Error(`Builder must keep id = ${id}`);
    }
    return upsertCatalogItem(catalog, next, opts);
}
