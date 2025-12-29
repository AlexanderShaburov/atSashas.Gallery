// src/features/admin/artCatalog/ui/ArtCatalogFilterControl/artCatalogFilterTypes.ts

export type ArtCatalogFilterState = {
    // Basic
    query: string; // title / fileName / id search
    tags: string[]; // multi-select via input + commit
    technique?: string; // one technique
    extended: boolean;

    // Advanced
    availability?: string; // keep string if Availability union is not re-exported here
    series?: string;
    hasPrice?: boolean; // tri-state via undefined/true/false if you want later
};
