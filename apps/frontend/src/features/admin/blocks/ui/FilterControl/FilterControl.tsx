//src/features/admin/blocks/ui/FilterControl/FilterControl.tsx:

import { BLOCK_KINDS, CTA_TYPES, GALLERY_LAYOUTS } from '@/entities/block/Block';
import { BlockFilterState } from '@/features/admin/blocks//BlockEditor/BlockEditor';
import { useBlockEditorSession } from '@/features/admin/blocks//hooks/useBlocksEditor';
import { useEffect, useState } from 'react';

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
    const { tags, kind, layout, ctaType, artName, extended } = filter;

    const [tagsList, setTagsList] = useState<string[]>([]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const updateTags = (t: string) => {
        const newTags = [...filter.tags, t];
        updateFilter({ tags: newTags });
    };
    return (
        <>
            <div className="filter-control__basic">
                {/* tags input section: */}
                <input
                    id="tags"
                    list="tags-list"
                    className="filter-control__input"
                    value={tags.join(', ') ?? ''}
                    onChange={(e) => updateTags(e.target.value)}
                    placeholder="Select tags to filter"
                />
                <datalist id="tags">
                    {tagsList.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>
                {/* BlockKind input section: */}
                <input
                    id="block-kind"
                    list="block-kind-list"
                    className="filter-control__input"
                    value={kind}
                    onChange={(e) => updateFilter({ kind: e.target.value })}
                    placeholder="Select block kind to filter"
                />
                <datalist id="block-kind-list">
                    {BLOCK_KINDS.map((t) => (
                        <option key={t} value={t} />
                    ))}
                </datalist>
                {/* BlockKind input section: */}
                <div className="filter-control__mode">
                    <button
                        className={!extended ? 'active' : ''}
                        onClick={() => updateFilter({ extended: false })}
                    >
                        Basic
                    </button>
                </div>
                <div className="filter-control__mode">
                    <button
                        className={extended ? 'active' : ''}
                        onClick={() => updateFilter({ extended: true })}
                    >
                        Advanced
                    </button>
                </div>
            </div>
            {extended && (
                <>
                    <div className="filter-control__basic">
                        <input
                            id="block-kind"
                            list="block-kind-list"
                            className="filter-control__input"
                            value={kind}
                            onChange={(e) => updateFilter({ kind: e.target.value })}
                            placeholder="Select block kind"
                        />
                        <datalist id="block-kind-list">
                            {BLOCK_KINDS.map((k) => (
                                <option key={k} value={k} />
                            ))}
                        </datalist>
                    </div>

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
                    <input
                        id="name-search"
                        className="filter-control__input"
                        value={artName ?? ''}
                        placeholder="Enter art name"
                        onChange={(e) => updateFilter({ artName: e.target.value })}
                    />
                </>
            )}
        </>
    );
}
