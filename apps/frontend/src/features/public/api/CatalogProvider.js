import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { loadCatalogOnce } from '@/features/public/api/catalogModule';
const CatalogContext = createContext(null);
export function CatalogProvider({ children }) {
    const [catalog, setCatalog] = useState(null);
    useEffect(() => {
        loadCatalogOnce().then(setCatalog);
    }, []);
    const value = {
        ready: !!catalog,
        catalog,
        get: (id) => (catalog ? (catalog.items[id] ?? null) : null),
    };
    return _jsx(CatalogContext.Provider, { value: value, children: children });
}
// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
    const ctx = useContext(CatalogContext);
    if (!ctx)
        throw new Error('useCatalog must be used within CatalogProvider');
    return ctx;
}
