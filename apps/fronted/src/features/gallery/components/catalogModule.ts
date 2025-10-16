import type { ArtItemJSON } from '@/features/gallery/types';
import type { ArtCatalog } from '../types/catalog';

const BASE = import.meta.env.VITE_VAULT_BASE_URL;
const CATALOG_URL = `${BASE}arts/catalog.json`;

let catalogCache: ArtCatalog | null = null;
let inflight: Promise<ArtCatalog> | null = null;

export async function loadCatalogOnce(): Promise<ArtCatalog> {
  if (catalogCache) return catalogCache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(CATALOG_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
      const data = (await res.json()) as ArtCatalog;
      catalogCache = data;

      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function getFromCatalog(id: string): ArtItemJSON | null {
  return catalogCache?.items?.[id] ?? null;
}
