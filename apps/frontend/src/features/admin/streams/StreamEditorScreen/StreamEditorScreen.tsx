// src/features/admin/streams/StreamEditorScreen/StreamEditorScreen.tsx
import { ScreenHeaderRow } from '@/features/admin/shared/ui/ScreenHeaderRow';
import { useStreamEditorSession } from '@/features/admin/streams/hooks/useStreamEditor';
import { applyStreamFilter } from '@/features/admin/streams/ui/FilterControl/applyStreamFilter';
import { StreamFilterState } from '@/features/admin/streams/ui/FilterControl/stream-filter.types';
import { DEFAULT_STREAM_FILTER } from '@/features/admin/streams/ui/FilterControl/streamFilter.defaults';
import { StreamFilterControl } from '@/features/admin/streams/ui/FilterControl/StreamFilterControl';
import { NewStreamComponent } from '@/features/admin/streams/ui/NewStreamComponent/NewStreamComponent';
import { SingleStreamEditor } from '@/features/admin/streams/ui/SingleStreamEditor/SingleStreamEditor';
import { ToolbarCtx } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './StreamEditorScreen.css';

export function StreamEditor() {
    const session = useStreamEditorSession();
    const {
        draft,
        isDirty,
        isLoading,
        isValid,
        isSaving,
        save,
        onEscape,
        delStream,
        selectedStreamId,
        addBlock,
        updateTags,
        streamsIndex,
        selectStream,
        createNewStream,
        threeDotHandler,
        editBlock,
        currentStack,
    } = session;

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (e.defaultPrevented) return;
                onEscape();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onEscape]);

    const currentMode = currentStack.mode.kind;

    useEffect(() => {
        if (currentMode === 'edit' && !draft) {
            onEscape();
        }
    }, [currentMode, onEscape, draft]);

    const toolbarProps: ToolbarCtx | null = useMemo(() => {
        if (!draft) return null;
        return {
            canSave: isDirty && !isLoading && isValid,
            saving: isSaving,
            save,
            exit: onEscape,
            onDelete: () => delStream(selectedStreamId ?? ''),
            addBlock,
            tags: draft.tags,
            onChangeTags: updateTags,
        };
    }, [
        draft,
        isDirty,
        isLoading,
        isValid,
        isSaving,
        save,
        onEscape,
        delStream,
        selectedStreamId,
        addBlock,
        updateTags,
    ]);

    const [filter, setFilter] = useState<StreamFilterState>(DEFAULT_STREAM_FILTER);

    const updateFilter = useCallback((patch: Partial<StreamFilterState>) => {
        setFilter((prev) => ({ ...prev, ...patch }));
    }, []);

    const filtered = useMemo(() => applyStreamFilter(streamsIndex, filter), [streamsIndex, filter]);
    const handleOnClick = useCallback(
        (id: string) => {
            selectStream(id);
        },
        [selectStream],
    );
    // Reduce blinking:
    if (!draft || !toolbarProps) {
        return (
            <div className="se">
                <div className="se__loading">Loading</div>
            </div>
        );
    }

    switch (currentMode) {
        case 'select':
            return (
                <div className="se">
                    <ScreenHeaderRow
                        left={<h1 className="se__title">Streams</h1>}
                        right={<StreamFilterControl filter={filter} updateFilter={updateFilter} />}
                    />
                    <div className="se__grid">
                        <NewStreamComponent createNewStream={createNewStream} />
                        {filtered.map((s) => (
                            <figure
                                key={s.streamId}
                                className="se__thumbnail"
                                role="button"
                                tabIndex={0}
                                onClick={() => handleOnClick(s.streamId)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                        handleOnClick(s.streamId);
                                }}
                            >
                                <img src={s.thumbnail} loading="lazy" />
                                <figcaption>{s.title ?? ''}</figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            );
        case 'error':
            return (
                <div className="se">
                    <div className="se__error-screen">
                        <p className="se__error-message">
                            {currentStack.mode.kind === 'error' ? currentStack.mode.message : ''}
                        </p>
                        <button className="se__error-ok" onClick={onEscape}>
                            OK
                        </button>
                    </div>
                </div>
            );
        case 'edit': {
            if (!draft || !toolbarProps) {
                // optional: show loading/placeholder instead of null
                return null;
            }

            return (
                <div className="se">
                    <SingleStreamEditor
                        stream={draft}
                        threeDotMenu={threeDotHandler}
                        editBlock={editBlock}
                        toolbarProps={toolbarProps}
                    />
                </div>
            );
        }
        default:
            return null;
    }
}
