// applyArtCatalogFilter.ts
import type { ArtItemData } from '@/entities/art/artUnit';
import type { PreviewPath, PreviewSources } from '@/entities/art/images';
import type { GridItem, GridItemSources } from '@/shared/ui/grid/gridItem';
import type { ArtCatalogFilterState } from './artCatalogFilter.types';

const norm = (s: string) => s.trim().toLowerCase();

function pickThumbUrl(preview?: PreviewSources): PreviewPath | '' {
    if (!preview) return '';
    return preview.jpeg ?? preview.webp ?? preview.avif ?? '';
}

function toGridSources(preview?: PreviewSources): GridItemSources | undefined {
    if (!preview) return undefined;

    const s: GridItemSources = {};
    if (preview.avif) s.avif = preview.avif;
    if (preview.webp) s.webp = preview.webp;
    if (preview.jpeg) s.jpeg = preview.jpeg;

    return Object.keys(s).length > 0 ? s : undefined;
}

function localizedToText(loc?: { [k: string]: unknown }): string {
    // We only care about typical keys; keep it safe.
    const en = typeof loc?.['en'] === 'string' ? String(loc?.['en']) : '';
    const ru = typeof loc?.['ru'] === 'string' ? String(loc?.['ru']) : '';
    const it = typeof loc?.['it'] === 'string' ? String(loc?.['it']) : '';
    return `${en} ${ru} ${it}`.trim();
}

export function applyArtCatalogFilter(
    itemsById: Record<string, ArtItemData>,
    filter: ArtCatalogFilterState,
): GridItem[] {
    const q = norm(filter.query ?? '');

    const items = Object.values(itemsById);

    const filtered = items.filter((it) => {
        // query match: id + localized title + notes
        if (q) {
            const title = localizedToText(
                it.title as unknown as { [k: string]: unknown } | undefined,
            );
            const hay = norm(`${it.id} ${title} ${it.notes ?? ''}`);
            if (!hay.includes(q)) return false;
        }

        // tags: all selected tags must exist
        if (filter.tags.length > 0) {
            const tset = new Set(it.tags ?? []);
            for (const t of filter.tags) {
                if (!tset.has(t)) return false;
            }
        }

        // technique
        if (filter.technique) {
            if (!(it.techniques ?? []).includes(filter.technique)) return false;
        }

        // availability
        if (filter.availability) {
            if (String(it.availability) !== String(filter.availability)) return false;
        }

        // series
        if (filter.series) {
            if ((it.series ?? '') !== filter.series) return false;
        }

        // has price
        if (filter.hasPrice) {
            if (!it.price) return false;
        }

        return true;
    });

    // Map to GridItem[]
    return filtered.map((it) => {
        const thumbUrl = pickThumbUrl(it.images?.preview);
        // console.log(`[applyArtCatalogFilter]: mapper -> item is:`);
        // console.dir(it);
        // console.log(`[applyArtCatalogFilter]: pickThumbUrl -> thumbUrl is:`);
        // console.dir(thumbUrl);

        const sources = toGridSources(it.images?.preview);

        return {
            id: it.id,
            thumbUrl, // PreviewPath fits your GridItem.thumbUrl:string
            sources,
            title: typeof it.title?.en === 'string' ? it.title.en : undefined,
            badge: it.series || (it.techniques?.[0] ?? undefined),
        };
    });
}
