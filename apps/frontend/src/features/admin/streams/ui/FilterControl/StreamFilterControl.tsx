// src/features/admin/streams/ui/StreamFilterControl/StreamFilterControl.tsx

import type { StreamIndexItem, StreamStatus } from '@/entities/stream';
import { useMemo, useState } from 'react';
import type { StreamFilterState } from './stream-filter.types';
import './StreamFilterControl.css';

type Props = {
    filter: StreamFilterState;
    updateFilter: (patch: Partial<StreamFilterState>) => void;

    // IMPORTANT: pass streams list (or index) from parent
    // so this control can build tag options without session hooks
    streams?: StreamIndexItem[];
};

const STREAM_STATUSES: StreamStatus[] = ['draft', 'ready', 'archived'];

export function StreamFilterControl({ filter, updateFilter, streams }: Props) {
    const { query, tags, status, extended, updatedAfter, updatedBefore } = filter;

    const [tagDraft, setTagDraft] = useState('');

    const tagsListId = 'sfc-tags';
    const statusListId = 'sfc-status';

    const tagsList = useMemo(() => {
        const set = new Set<string>();
        (streams ?? []).forEach((s) => {
            (s.tags ?? []).forEach((t) => {
                if (t) set.add(t);
            });
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [streams]);

    const commitTag = (v: string) => {
        const t = v.trim();
        if (!t) return;
        if (tags.includes(t)) return;
        updateFilter({ tags: [...tags, t] });
        setTagDraft('');
    };

    const removeTag = (t: string) => {
        updateFilter({ tags: tags.filter((x) => x !== t) });
    };

    return (
        <>
            <div className="stream-filter__basic">
                {/* query */}
                <input
                    className="stream-filter__input"
                    value={query}
                    onChange={(e) => updateFilter({ query: e.target.value })}
                    placeholder="Search streams…"
                />

                {/* tags input */}
                <input
                    list={tagsListId}
                    className="stream-filter__input"
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
                    {tagsList.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>

                {/* mode selector */}
                <div className="stream-filter__mode-selector">
                    <div className="stream-filter__mode">
                        <button
                            type="button"
                            className={!extended ? 'active' : ''}
                            onClick={() => updateFilter({ extended: false })}
                        >
                            Basic
                        </button>
                    </div>
                    <div className="stream-filter__mode">
                        <button
                            type="button"
                            className={extended ? 'active' : ''}
                            onClick={() => updateFilter({ extended: true })}
                        >
                            Advanced
                        </button>
                    </div>
                </div>
            </div>

            {/* selected tags chips row (optional but UX-nice) */}
            {tags.length > 0 && (
                <div className="stream-filter__chips">
                    {tags.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className="stream-filter__chip"
                            onClick={() => removeTag(t)}
                            title="Remove tag"
                        >
                            {t} ✕
                        </button>
                    ))}
                    <button
                        type="button"
                        className="stream-filter__chip stream-filter__chip--clear"
                        onClick={() => updateFilter({ tags: [] })}
                    >
                        Clear tags
                    </button>
                </div>
            )}

            {extended && (
                <div className="stream-filter__advanced">
                    {/* status */}
                    <input
                        list={statusListId}
                        className="stream-filter__input"
                        value={status ?? ''}
                        onChange={(e) =>
                            updateFilter({
                                status:
                                    e.target.value === ''
                                        ? undefined
                                        : (e.target.value as StreamStatus),
                            })
                        }
                        placeholder="Status"
                    />
                    <datalist id={statusListId}>
                        {STREAM_STATUSES.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>

                    {/* updated range */}
                    <input
                        type="date"
                        className="stream-filter__input"
                        value={updatedAfter ?? ''}
                        onChange={(e) =>
                            updateFilter({ updatedAfter: e.target.value || undefined })
                        }
                        placeholder="Updated after"
                    />
                    <input
                        type="date"
                        className="stream-filter__input"
                        value={updatedBefore ?? ''}
                        onChange={(e) =>
                            updateFilter({ updatedBefore: e.target.value || undefined })
                        }
                        placeholder="Updated before"
                    />
                </div>
            )}
        </>
    );
}
