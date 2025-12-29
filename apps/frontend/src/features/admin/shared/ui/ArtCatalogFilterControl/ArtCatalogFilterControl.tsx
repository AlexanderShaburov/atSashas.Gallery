// src/features/admin/artCatalog/ui/ArtCatalogFilterControl/ArtCatalogFilterControl.tsx

import type { ArtItemData } from '@/entities/art/artUnit';
import { useEffect, useMemo, useState } from 'react';
import type { ArtCatalogFilterState } from './artCatalogFilter.types';
import './ArtCatalogFilterControl.css';

type Props = {
    // Catalog items (source of options lists)
    items: Record<string, ArtItemData> | undefined;

    filter: ArtCatalogFilterState;
    updateFilter: (patch: Partial<ArtCatalogFilterState>) => void;
    onBack?: () => void;
};

export function ArtCatalogFilterControl({ items, filter, updateFilter, onBack }: Props) {
    const { extended, technique, availability, series } = filter;

    const [tagDraft, setTagDraft] = useState('');
    const [techList, setTechList] = useState<string[]>([]);
    const [tagList, setTagList] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [availabilityList, setAvailabilityList] = useState<string[]>([]);

    const tagsListId = 'acfc-tags';
    const techListId = 'acfc-tech';
    const seriesListId = 'acfc-series';
    const availabilityListId = 'acfc-availability';

    const allItemsArray = useMemo(() => (items ? Object.values(items) : []), [items]);

    useEffect(() => {
        if (!items) {
            setTechList([]);
            setTagList([]);
            setSeriesList([]);
            setAvailabilityList([]);
            return;
        }

        const tags = new Set<string>();
        const techs = new Set<string>();
        const seriesSet = new Set<string>();
        const availabilitySet = new Set<string>();

        for (const it of Object.values(items)) {
            it.tags?.forEach((t) => tags.add(t));
            it.techniques?.forEach((t) => techs.add(t));
            if (it.series) seriesSet.add(it.series);
            if (it.availability) availabilitySet.add(String(it.availability));
        }

        setTagList(Array.from(tags).sort());
        setTechList(Array.from(techs).sort());
        setSeriesList(Array.from(seriesSet).sort());
        setAvailabilityList(Array.from(availabilitySet).sort());
    }, [items]);

    const commitTag = (v: string) => {
        const t = v.trim();
        if (!t) return;
        if (filter.tags.includes(t)) return;
        updateFilter({ tags: [...filter.tags, t] });
        setTagDraft('');
    };

    const clearTags = () => updateFilter({ tags: [] });

    return (
        <>
            <div className="art-filter-control__basic">
                {/* Query */}
                <input
                    className="art-filter-control__input"
                    value={filter.query ?? ''}
                    onChange={(e) => updateFilter({ query: e.target.value })}
                    placeholder="Search title / id / file…"
                />

                {/* Tags (multi add) */}
                <div className="art-filter-control__tags">
                    <input
                        list={tagsListId}
                        className="art-filter-control__input"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onBlur={() => commitTag(tagDraft)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                commitTag(tagDraft);
                            }
                        }}
                        placeholder="Add tag…"
                    />
                    <datalist id={tagsListId}>
                        {tagList.map((t) => (
                            <option key={t} value={t} />
                        ))}
                    </datalist>

                    {/* Selected tags chips (minimal) */}
                    <div className="art-filter-control__chips">
                        {filter.tags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                className="art-filter-control__chip"
                                onClick={() =>
                                    updateFilter({ tags: filter.tags.filter((x) => x !== t) })
                                }
                                title="Remove tag"
                            >
                                {t} ×
                            </button>
                        ))}
                        {filter.tags.length > 0 && (
                            <button
                                type="button"
                                className="art-filter-control__chip art-filter-control__chip--muted"
                                onClick={clearTags}
                                title="Clear tags"
                            >
                                clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Technique */}
                <input
                    list={techListId}
                    className="art-filter-control__input"
                    value={technique ?? ''}
                    onChange={(e) => updateFilter({ technique: e.target.value || undefined })}
                    placeholder="Technique"
                />
                <datalist id={techListId}>
                    {techList.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>

                {/* Mode switch */}
                <div className="art-filter-control__mode-selector">
                    <div className="art-filter-control__mode art-filter-control__mode--basic">
                        <button
                            type="button"
                            className={!extended ? 'active' : ''}
                            onClick={() => updateFilter({ extended: false })}
                        >
                            Basic
                        </button>
                    </div>
                    <div className="art-filter-control__mode art-filter-control__mode--advanced">
                        <button
                            type="button"
                            className={extended ? 'active' : ''}
                            onClick={() => updateFilter({ extended: true })}
                        >
                            Advanced
                        </button>
                    </div>
                    {!!onBack && (
                        <div className="art-filter-control__mode art-filter-control__mode--back">
                            <button
                                type="button"
                                onClick={onBack}
                                className="art-filter-control__back"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {extended && (
                <div className="art-filter-control__advanced">
                    {/* Availability */}
                    <input
                        list={availabilityListId}
                        className="art-filter-control__input"
                        value={availability ?? ''}
                        onChange={(e) =>
                            updateFilter({ availability: e.target.value || undefined })
                        }
                        placeholder="Availability"
                    />
                    <datalist id={availabilityListId}>
                        {availabilityList.map((v) => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    {/* Series */}
                    <input
                        list={seriesListId}
                        className="art-filter-control__input"
                        value={series ?? ''}
                        onChange={(e) => updateFilter({ series: e.target.value || undefined })}
                        placeholder="Series"
                    />
                    <datalist id={seriesListId}>
                        {seriesList.map((v) => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    {/* Has price (simple toggle-like button) */}
                    <button
                        type="button"
                        className={`art-filter-control__toggle ${filter.hasPrice ? 'on' : ''}`}
                        onClick={() => updateFilter({ hasPrice: !filter.hasPrice })}
                        disabled={allItemsArray.length === 0}
                        title="Filter items that have price"
                    >
                        Has price
                    </button>
                </div>
            )}
        </>
    );
}
