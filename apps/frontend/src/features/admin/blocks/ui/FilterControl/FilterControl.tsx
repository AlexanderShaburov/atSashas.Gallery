//src/features/admin/blocks/ui/FilterControl/FilterControl.tsx:

import { BLOCK_KINDS, CTA_TYPES, GALLERY_LAYOUTS } from '@/entities/block/Block';
import { useBlockEditorSession } from '@/features/admin/blocks//hooks/useBlocksEditor';
import { BlockFilterState } from '@/features/admin/blocks/BlockEditorScreen/BlockEditorScreen';
import { useEffect, useState } from 'react';
import './FilterControl.css';

/* 
What should do filter control?
1. What parameters we want to be filtered by:
    - tags [string];
    - BlockKind;
    - if GalleryBlock -> by layout;
    - if CtaBlock -> by action type;
    - by name of used art;

For tags inputs we should see all selected already tags!!!!!

Then we need two filter layouts: basic and advanced:
    - basic contains tags and BlockKind
    - advanced adds all the rest

For input fields we need options lists:
    - for tags formed on existed tags (collection NO catalog);
    - for BlockKind -> based on the data type;
    - layouts -> based on the data type;
    - Cta actions -> based on the data type;
    - name ->  text input;



Then I see firs filter string with tags and kinds inputs and advanced filter radiobutton
and second string depended on radiobutton with layouts/actions or invisible if textBlock,
and name text input;

Also we need tags collector function, which has to run on collection and make valid tags list
to use as options

*/
type Props = {
    filter: BlockFilterState;
    updateFilter: (patch: Partial<BlockFilterState>) => void;
};
export function FilterControl({ filter, updateFilter }: Props) {
    const ctx = useBlockEditorSession();
    const { kind, layout, ctaType, artName, extended } = filter;
    const [tagDraft, setTagDraft] = useState('');
    const [tagsList, setTagsList] = useState<string[]>([]);

    const tagsListId = 'fc-tags';
    const kindListId = 'fc-block-kind';

    useEffect(() => {
        if (!ctx.collection) return;

        const tags: string[] = [];
        Object.values(ctx.collection?.blocks).forEach((b) => {
            b.tags?.forEach((t) => {
                if (!tags.includes(t)) {
                    tags.push(t);
                }
            });
        });
        setTagsList(tags);
    }, [ctx.collection]);

    const commitTag = (v: string) => {
        const t = v.trim();
        if (!t) return;
        if (filter.tags.includes(t)) return;
        updateFilter({ tags: [...filter.tags, t] });
    };

    return (
        <>
            <div className="filter-control__basic">
                {/* tags input section: */}
                <input
                    list={tagsListId}
                    className="filter-control__input"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onBlur={() => commitTag(tagDraft)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            commitTag(tagDraft);
                        }
                    }}
                    placeholder="Select tags to filter"
                />
                <datalist id={tagsListId}>
                    {tagsList.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>
                {/* BlockKind input section: */}
                <input
                    list={kindListId}
                    className="filter-control__input"
                    value={kind}
                    onChange={(e) => updateFilter({ kind: e.target.value })}
                    placeholder="Select block kind to filter"
                />
                <datalist id={kindListId}>
                    {BLOCK_KINDS.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>
                {/* Filter mode selector: */}
                <div className="filter-control__mode-selector">
                    <div className="filter-control__mode">
                        <button
                            type="button"
                            className={!extended ? 'active' : ''}
                            onClick={() => updateFilter({ extended: false })}
                        >
                            Basic
                        </button>
                    </div>
                    <div className="filter-control__mode">
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
            {extended && (
                <div className="filter-control__advanced">
                    <input
                        id="name-search"
                        className="filter-control__input"
                        value={artName ?? ''}
                        placeholder="Enter art name"
                        onChange={(e) => updateFilter({ artName: e.target.value })}
                    />
                    {kind === 'gallery' && (
                        <>
                            <input
                                id="layout-style"
                                list="layouts-list"
                                className="filter-control__input"
                                value={layout}
                                onChange={(e) => updateFilter({ layout: e.target.value })}
                                placeholder="Select Layout style"
                            />
                            <datalist id="layouts-list">
                                {GALLERY_LAYOUTS.map((l) => (
                                    <option key={l} value={l} />
                                ))}
                            </datalist>
                        </>
                    )}
                    {kind === 'cta' && (
                        <>
                            <input
                                id="cta-type"
                                list="cta-types-list"
                                className="filter-control__input"
                                value={ctaType}
                                onChange={(e) => updateFilter({ ctaType: e.target.value })}
                                placeholder="Select CTA type"
                            />
                            <datalist id="cta-types-list">
                                {CTA_TYPES.map((t) => (
                                    <option key={t} value={t} />
                                ))}
                            </datalist>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
