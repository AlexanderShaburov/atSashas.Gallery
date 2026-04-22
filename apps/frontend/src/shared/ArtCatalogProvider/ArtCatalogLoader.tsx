// src/shared/entities/art/ArtCatalogLoader.tsx
//
// Loads the art catalog once at app boot. In a clean deployment the
// catalog file may be absent — that is not a fatal condition: we fall
// back to an empty catalog so the app still boots and the admin can
// upload from the hopper. Only a genuine unexpected failure is surfaced
// as a blocking error to the admin.

import type { ArtCatalog } from '@/entities/catalog';
import { ApiResponse } from '@/entities/common';
import { ArtCatalogProvider } from '@/shared/ArtCatalogProvider/ArtCatalogProvider';
import { useEffect, useState } from 'react';

// `|| '/api'` matches every other module in this app. Without it, a build
// that does not substitute VITE_API_BASE_URL (Docker image without .env
// in context, for example) produces `undefined/json/art_catalog` — which
// WebKit rejects with "The string did not match the expected pattern".
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const JSON_VAULT = `${API_BASE}/json`;

type ArtCatalogLoaderProps = {
    mode: 'public' | 'admin';
    children: React.ReactNode;
};

function emptyCatalog(): ArtCatalog {
    return {
        catalogVersion: 0,
        updatedAt: new Date().toISOString(),
        items: {},
        order: [],
    };
}

async function getCatalog(): Promise<ArtCatalog> {
    const request = `${JSON_VAULT}/art_catalog`;
    const res = await fetch(request);

    // Clean-deploy contract: a missing art_catalog.json is not an error.
    // The backend's json_kv endpoint already returns 404 for unknown keys;
    // we treat that as an empty catalog so the app can still boot.
    if (res.status === 404) {
        console.warn(
            '[ArtCatalogProvider]: art_catalog returned 404; booting with empty catalog.',
        );
        return emptyCatalog();
    }

    if (!res.ok) {
        throw new Error(`Catalog ${res.status}`);
    }

    try {
        const raw = (await res.json()) as ApiResponse<ArtCatalog>;
        console.log('[ArtCatalogProvider]: Catalog loaded as:');
        console.dir(raw.data);
        return raw.data;
    } catch (err) {
        // Non-JSON body (e.g. HTML error page from a misrouted proxy) —
        // still preferable to fall back to empty catalog rather than
        // blocking the whole app. A warning is logged for diagnosis.
        console.warn(
            '[ArtCatalogProvider]: art_catalog response was not valid JSON; booting with empty catalog.',
            err,
        );
        return emptyCatalog();
    }
}

export function ArtCatalogLoader({ mode, children }: ArtCatalogLoaderProps) {
    const [catalog, setCatalog] = useState<ArtCatalog | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadCatalog() {
            try {
                const next = await getCatalog();
                if (isMounted) setCatalog(next);
            } catch (e) {
                // A genuine unexpected failure (network error, non-404 HTTP
                // status) still surfaces as a blocking error so it does not
                // go unnoticed. Transient catalog misses degrade silently
                // via the empty-catalog paths above.
                if (isMounted) setError(e as Error);
            }
        }

        void loadCatalog();

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
