// src/shared/entities/art/ArtCatalogLoader.tsx
import type { ArtCatalog } from '@/entities/catalog';
import { ApiResponse } from '@/entities/common';
import { ArtCatalogProvider } from '@/shared/ArtCatalogProvider.tsx/ArtCatalogProvider';
import { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const JSON_VAULT = `${API_BASE}/json`;
type ArtCatalogLoaderProps = {
    mode: 'public' | 'admin';
    children: React.ReactNode;
};

async function getCatalog(): Promise<ArtCatalog> {
    const request = `${JSON_VAULT}/art_catalog`;
    const res = await fetch(request);
    if (!res.ok) throw new Error(`Catalog ${res.status}`);
    const raw = (await res.json()) as ApiResponse<ArtCatalog>;
    return raw.data;
}

export function ArtCatalogLoader({ mode, children }: ArtCatalogLoaderProps) {
    const [catalog, setCatalog] = useState<ArtCatalog | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadCatalog() {
            try {
                if (isMounted) setCatalog(await getCatalog());
            } catch (e) {
                if (isMounted) {
                    setError(e as Error);
                }
            }
        }

        loadCatalog();

        return () => {
            isMounted = false;
        };
    }, [mode]);

    if (error) {
        return <div>Art Catalog download error: {error.message}</div>;
    }

    if (!catalog) {
        return <div>Downloading Art Catalog …</div>;
    }

    return <ArtCatalogProvider catalog={catalog}>{children}</ArtCatalogProvider>;
}
