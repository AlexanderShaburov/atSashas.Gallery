// src/features/images/CatalogContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ArtCatalog } from '@/entities/catalog';

import { getFromCatalog, loadCatalogOnce } from './catalogModule';

type Ctx = {
    ready: boolean;
    catalog: ArtCatalog | null;
    get(id: string): ReturnType<typeof getFromCatalog>;
};
const CatalogContext = createContext<Ctx | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
    const [catalog, setCatalog] = useState<ArtCatalog | null>(null);

    useEffect(() => {
        loadCatalogOnce().then(setCatalog).catch(console.error);
    }, []);

    const value: Ctx = {
        ready: !!catalog,
        catalog,
        get: (id) => (catalog ? (catalog.items[id] ?? null) : null),
    };

    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
    const ctx = useContext(CatalogContext);
    if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
    return ctx;
}
