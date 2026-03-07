// src/features/admin/artCatalog/ui/ArtCatalogFilterControl/ArtCatalogFilterControl.tsx

import type { ArtItemData, TechniquesJson } from '@/entities/art';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArtCatalogFilterState } from './artCatalogFilter.types';
import './ArtCatalogFilterControl.css';

type Props = {
    // Catalog items (source of options lists)
    items: Record<string, ArtItemData> | undefined;
    /** Full techniques reference (categorized). If provided, dropdown shows all available techniques. */
    techniquesRange?: TechniquesJson;

    filter: ArtCatalogFilterState;
    updateFilter: (patch: Partial<ArtCatalogFilterState>) => void;
};

const EMPTY_FILTER: ArtCatalogFilterState = {
    query: '',
    tags: [],
    technique: undefined,
    extended: false,
    availability: undefined,
    series: undefined,
    hasPrice: undefined,
};

export function ArtCatalogFilterControl({ items, techniquesRange, filter, updateFilter }: Props) {
    const { extended, technique, availability, series } = filter;

    const [tagDraft, setTagDraft] = useState('');
    const [tagFocused, setTagFocused] = useState(false);
    const [techList, setTechList] = useState<string[]>([]);
    const [techFocused, setTechFocused] = useState(false);
    const [availFocused, setAvailFocused] = useState(false);
    const [seriesFocused, setSeriesFocused] = useState(false);
    const tagWrapRef = useRef<HTMLDivElement>(null);
    const techWrapRef = useRef<HTMLDivElement>(null);
    const availWrapRef = useRef<HTMLDivElement>(null);
    const seriesWrapRef = useRef<HTMLDivElement>(null);
    const [tagList, setTagList] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [availabilityList, setAvailabilityList] = useState<string[]>([]);

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

        // If full techniques reference is available, use it instead of catalog-derived list
        if (techniquesRange) {
            for (const cat of Object.values(techniquesRange)) {
                for (const item of cat.items) {
                    techs.add(typeof item === 'string' ? item : item.key);
                }
            }
        }

        setTagList(Array.from(tags).sort());
        setTechList(Array.from(techs).sort());
        setSeriesList(Array.from(seriesSet).sort());
        setAvailabilityList(Array.from(availabilitySet).sort());
    }, [items, techniquesRange]);

    // Close dropdowns on click outside
    useEffect(() => {
        if (!tagFocused && !techFocused && !availFocused && !seriesFocused) return;
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (tagFocused && tagWrapRef.current && !tagWrapRef.current.contains(target)) {
                setTagFocused(false);
            }
            if (techFocused && techWrapRef.current && !techWrapRef.current.contains(target)) {
                setTechFocused(false);
            }
            if (availFocused && availWrapRef.current && !availWrapRef.current.contains(target)) {
                setAvailFocused(false);
            }
            if (seriesFocused && seriesWrapRef.current && !seriesWrapRef.current.contains(target)) {
                setSeriesFocused(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [tagFocused, techFocused, availFocused, seriesFocused]);

    const tagSuggestions = useMemo(() => {
        const q = tagDraft.toLowerCase();
        const already = new Set(filter.tags);
        const list = tagList.filter((t) => !already.has(t));
        if (!q) return list;
        return list.filter((t) => t.toLowerCase().includes(q));
    }, [tagDraft, tagList, filter.tags]);

    const techSuggestions = useMemo(() => {
        const q = (technique ?? '').toLowerCase();
        if (!q) return techList;
        return techList.filter((t) => t.toLowerCase().includes(q));
    }, [technique, techList]);

    const availSuggestions = useMemo(() => {
        const q = (availability ?? '').toLowerCase();
        if (!q) return availabilityList;
        return availabilityList.filter((v) => v.toLowerCase().includes(q));
    }, [availability, availabilityList]);

    const seriesSuggestions = useMemo(() => {
        const q = (series ?? '').toLowerCase();
        if (!q) return seriesList;
        return seriesList.filter((v) => v.toLowerCase().includes(q));
    }, [series, seriesList]);

    const hasActiveFilter =
        filter.query !== '' ||
        filter.tags.length > 0 ||
        !!filter.technique ||
        !!filter.availability ||
        !!filter.series ||
        !!filter.hasPrice;

    const clearAll = () => {
        updateFilter({ ...EMPTY_FILTER, extended: filter.extended });
        setTagDraft('');
    };

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
                    <div className="art-filter-control__autocomplete" ref={tagWrapRef}>
                        <input
                            className="art-filter-control__input"
                            value={tagDraft}
                            onChange={(e) => {
                                setTagDraft(e.target.value);
                                setTagFocused(true);
                            }}
                            onFocus={() => setTagFocused(true)}
                            onBlur={() => commitTag(tagDraft)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    commitTag(tagDraft);
                                    setTagFocused(false);
                                }
                            }}
                            placeholder="Add tag…"
                        />
                        {tagFocused && tagSuggestions.length > 0 && (
                            <ul className="art-filter-control__dropdown">
                                {tagSuggestions.map((t) => (
                                    <li
                                        key={t}
                                        className="art-filter-control__dropdown-item"
                                        onMouseDown={() => {
                                            commitTag(t);
                                            setTagFocused(false);
                                        }}
                                    >
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

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
                <div className="art-filter-control__autocomplete" ref={techWrapRef}>
                    <input
                        className="art-filter-control__input"
                        value={technique ?? ''}
                        onChange={(e) => {
                            updateFilter({ technique: e.target.value || undefined });
                            setTechFocused(true);
                        }}
                        onFocus={() => setTechFocused(true)}
                        placeholder="Technique"
                    />
                    {techFocused && techSuggestions.length > 0 && (
                        <ul className="art-filter-control__dropdown">
                            {techSuggestions.map((t) => (
                                <li
                                    key={t}
                                    className="art-filter-control__dropdown-item"
                                    onMouseDown={() => {
                                        updateFilter({ technique: t });
                                        setTechFocused(false);
                                    }}
                                >
                                    {t}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Mode toggle + Clear */}
                <div className="art-filter-control__actions">
                    <button
                        type="button"
                        className={'art-filter-control__mode-toggle' + (extended ? ' on' : '')}
                        onClick={() => updateFilter({ extended: !extended })}
                    >
                        <span className="art-filter-control__toggle-track">
                            <span className="art-filter-control__toggle-thumb" />
                        </span>
                        {extended ? 'Advanced' : 'Basic'}
                    </button>
                    {hasActiveFilter && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="art-filter-control__clear"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {extended && (
                <div className="art-filter-control__advanced">
                    {/* Availability */}
                    <div className="art-filter-control__autocomplete" ref={availWrapRef}>
                        <input
                            className="art-filter-control__input"
                            value={availability ?? ''}
                            onChange={(e) => {
                                updateFilter({ availability: e.target.value || undefined });
                                setAvailFocused(true);
                            }}
                            onFocus={() => setAvailFocused(true)}
                            placeholder="Availability"
                        />
                        {availFocused && availSuggestions.length > 0 && (
                            <ul className="art-filter-control__dropdown">
                                {availSuggestions.map((v) => (
                                    <li
                                        key={v}
                                        className="art-filter-control__dropdown-item"
                                        onMouseDown={() => {
                                            updateFilter({ availability: v });
                                            setAvailFocused(false);
                                        }}
                                    >
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Series */}
                    <div className="art-filter-control__autocomplete" ref={seriesWrapRef}>
                        <input
                            className="art-filter-control__input"
                            value={series ?? ''}
                            onChange={(e) => {
                                updateFilter({ series: e.target.value || undefined });
                                setSeriesFocused(true);
                            }}
                            onFocus={() => setSeriesFocused(true)}
                            placeholder="Series"
                        />
                        {seriesFocused && seriesSuggestions.length > 0 && (
                            <ul className="art-filter-control__dropdown">
                                {seriesSuggestions.map((v) => (
                                    <li
                                        key={v}
                                        className="art-filter-control__dropdown-item"
                                        onMouseDown={() => {
                                            updateFilter({ series: v });
                                            setSeriesFocused(false);
                                        }}
                                    >
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

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
