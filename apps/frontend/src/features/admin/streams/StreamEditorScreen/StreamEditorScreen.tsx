// src/features/admin/streams/StreamEditorScreen/StreamEditorScreen.tsx
import { StreamMetadata } from '@/entities/stream';
import { ScreenHeaderRow } from '@/features/admin/shared/ui/ScreenHeaderRow';
import { useStreamEditorSession } from '@/features/admin/streams/hooks/useStreamEditor';
import { applyStreamFilter } from '@/features/admin/streams/ui/FilterControl/applyStreamFilter';
import { StreamFilterState } from '@/features/admin/streams/ui/FilterControl/stream-filter.types';
import { DEFAULT_STREAM_FILTER } from '@/features/admin/streams/ui/FilterControl/streamFilter.defaults';
import { StreamFilterControl } from '@/features/admin/streams/ui/FilterControl/StreamFilterControl';
import {
    NewStreamComponent,
    StreamMetaComponent,
} from '@/features/admin/streams/ui/NewStreamComponent';
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
        isJourney,
        isPublished,
        publicStream,
        save,
        onApply,
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
        commitMetaEditor,
        editMetadata,
        publishStream,
        unpublishStream,
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

    const addBlockFromToolbar = useCallback(() => {
        const length = draft?.blockIds.length ?? 0;
        addBlock(length);
    }, [addBlock, draft?.blockIds]);

    const toolbarProps: ToolbarCtx | null = useMemo(() => {
        if (!draft) return null;
        console.log(`[StreamEditor] toolbarProps calculator. `);
        console.log(`[StreamEditor] isDirty: ${isDirty} `);
        console.log(`[StreamEditor] isLoading: ${isLoading} `);
        console.log(`[StreamEditor] isValid: ${isValid} `);
        console.log(`[StreamEditor] isJourney: ${isJourney} `);

        // Can only publish if stream has a thumbnail
        const canPublish = !isPublished && !!draft.thumbnail;

        return {
            canSave: isDirty && !isLoading && isValid,
            isSaving,
            isPublished,
            tags: draft.tags,
            onAdd: addBlockFromToolbar,
            onEdit: editMetadata,
            onDelete: () => delStream(selectedStreamId ?? ''),
            onApply: onApply,
            save,
            exit: onEscape,
            onChangeTags: updateTags,
            onPublish: canPublish ? () => void publishStream() : undefined,
            onUnpublish: () => void unpublishStream(),
        };
    }, [
        draft,
        isDirty,
        isLoading,
        isValid,
        isSaving,
        isJourney,
        save,
        onApply,
        onEscape,
        delStream,
        selectedStreamId,
        updateTags,
        addBlockFromToolbar,
        editMetadata,
        isPublished,
        publishStream,
        unpublishStream,
    ]);

    const initial: StreamMetadata = {
        streamId: draft?.streamId ?? '',
        title: draft?.title ?? '',
        tags: draft?.tags ?? [],
        description: draft?.description ?? '',
        thumbnail: draft?.thumbnail ?? '',
    };

    const [filter, setFilter] = useState<StreamFilterState>(DEFAULT_STREAM_FILTER);

    const updateFilter = useCallback((patch: Partial<StreamFilterState>) => {
        setFilter((prev) => ({ ...prev, ...patch }));
    }, []);

    const filtered = useMemo(() => applyStreamFilter(streamsIndex, filter), [streamsIndex, filter]);
    const handleOnClick = useCallback(
        async (id: string) => {
            await selectStream(id);
        },
        [selectStream],
    );

    // Determine toolbar tools based on journey state and publish status
    const toolbarTools = useMemo(() => {
        const baseTools = ['delete', 'tags', 'add', 'edit'];
        console.log(`[StreamEditor] Computing toolbarTools. isJourney=${isJourney}, isPublished=${isPublished}`);

        // Add publish/unpublish (only one will render based on isPublished)
        const withPublish = [...baseTools, 'publish', 'unpublish'];

        // Add exit and save
        const withActions = [...withPublish, 'exit', 'save'];

        if (isJourney) {
            // In journey: add 'apply' button
            const tools = [...withActions, 'apply'];
            console.log(`[StreamEditor] In journey, tools:`, tools);
            return tools;
        }
        console.log(`[StreamEditor] Not in journey, tools:`, withActions);
        return withActions;
    }, [isJourney, isPublished]);

    // Reduce blinking:
    // if (!draft || !toolbarProps) {
    //     return (
    //         <div className="se">
    //             <div className="se__loading">Loading</div>
    //         </div>
    //     );
    // }
    console.log(`[StreamEditor]: draft currently is:`);
    console.dir(draft);
    console.log(`[StreamEditor]: toolbarProps currently is:`);
    console.dir(toolbarProps);

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
                        {filtered.map((s) => {
                            const isStreamPublished = publicStream?.streamIds.includes(s.streamId) ?? false;
                            return (
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
                                    {isStreamPublished && (
                                        <span className="se__badge se__badge--public">PUBLIC</span>
                                    )}
                                    <img src={s.thumbnail} loading="lazy" />
                                    <figcaption>{s.title ?? ''}</figcaption>
                                </figure>
                            );
                        })}
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
                return (
                    <div className="se">
                        <div className="se__loading">Loading…</div>
                    </div>
                );
            }

            return (
                <div className="se">
                    <SingleStreamEditor
                        stream={draft}
                        threeDotMenu={threeDotHandler}
                        editBlock={editBlock}
                        toolbarProps={toolbarProps}
                        toolbarTools={toolbarTools}
                    />
                </div>
            );
        }
        case 'meta':
            return (
                <div className="se">
                    <ScreenHeaderRow left={<h1 className="se__title">Streams</h1>} right={null} />
                    <StreamMetaComponent
                        initial={initial}
                        currentThumbnail={draft?.thumbnail}
                        onSelectThumbnail={session.selectThumbnail}
                        onCancel={onEscape}
                        onSubmit={commitMetaEditor}
                        isLoading={isLoading}
                    />
                </div>
            );
        default:
            return null;
    }
}
