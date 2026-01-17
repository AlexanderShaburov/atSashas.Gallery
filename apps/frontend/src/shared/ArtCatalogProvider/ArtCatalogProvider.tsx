import { ArtCatalog } from '@/entities/catalog';
import { createContext } from 'react';

export interface Props {
    catalog?: ArtCatalog;
    children: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ArtCatalogContext = createContext<ArtCatalog | undefined>(undefined);

export function ArtCatalogProvider({ catalog, children }: Props) {
    return <ArtCatalogContext.Provider value={catalog}>{children}</ArtCatalogContext.Provider>;
}
