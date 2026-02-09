const BASE = import.meta.env.VITE_VAULT_BASE_URL;
const CATALOG_URL = `${BASE}arts/catalog.json`;
let catalogCache = null;
let inflight = null;
export async function loadCatalogOnce() {
    if (catalogCache)
        return catalogCache;
    if (inflight)
        return inflight;
    inflight = (async () => {
        try {
            const res = await fetch(CATALOG_URL, { cache: 'no-store' });
            if (!res.ok)
                throw new Error(`Catalog HTTP ${res.status}`);
            const data = (await res.json());
            catalogCache = data;
            return data;
        }
        finally {
            inflight = null;
        }
    })();
    return inflight;
}
export function getFromCatalog(id) {
    return catalogCache?.items?.[id] ?? null;
}
