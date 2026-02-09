import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { ArtCatalogProvider } from '@/shared/ArtCatalogProvider/ArtCatalogProvider';
import { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const JSON_VAULT = `${API_BASE}/json`;
async function getCatalog() {
    const request = `${JSON_VAULT}/art_catalog`;
    const res = await fetch(request);
    if (!res.ok)
        throw new Error(`Catalog ${res.status}`);
    const raw = (await res.json());
    console.log(`[ArtCatalogProvider]: Catalog loaded as:`);
    console.dir(raw.data);
    return raw.data;
}
export function ArtCatalogLoader({ mode, children }) {
    const [catalog, setCatalog] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let isMounted = true;
        async function loadCatalog() {
            try {
                if (isMounted)
                    setCatalog(await getCatalog());
            }
            catch (e) {
                if (isMounted) {
                    setError(e);
                }
            }
        }
        loadCatalog();
        return () => {
            isMounted = false;
        };
    }, [mode]);
    if (error) {
        return _jsxs("div", { children: ["Art Catalog download error: ", error.message] });
    }
    if (!catalog) {
        return _jsx("div", { children: "Downloading Art Catalog \u2026" });
    }
    return _jsx(ArtCatalogProvider, { catalog: catalog, children: children });
}
