import { jsx as _jsx } from "react/jsx-runtime";
import { createContext } from 'react';
// eslint-disable-next-line react-refresh/only-export-components
export const ArtCatalogContext = createContext(undefined);
export function ArtCatalogProvider({ catalog, children }) {
    return _jsx(ArtCatalogContext.Provider, { value: catalog, children: children });
}
