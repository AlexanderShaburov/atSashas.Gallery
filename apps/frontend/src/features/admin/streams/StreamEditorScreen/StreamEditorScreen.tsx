// src/features/admin/streams/StreamEditorScreen/StreamEditorScreen.tsx
import { ScreenHeaderRow } from '@/features/admin/shared/ui/ScreenHeaderRow';
import { useStreamEditorSession } from '@/features/admin/streams/hooks/useStreamEditor';
import { applyStreamFilter } from '@/features/admin/streams/ui/FilterControl/applyStreamFilter';
import { StreamFilterState } from '@/features/admin/streams/ui/FilterControl/stream-filter.types';
import { DEFAULT_STREAM_FILTER } from '@/features/admin/streams/ui/FilterControl/streamFilter.defaults';
import { StreamFilterControl } from '@/features/admin/streams/ui/FilterControl/StreamFilterControl';
import { NewStreamComponent } from '@/features/admin/streams/ui/NewStreamComponent/NewStreamComponent';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './StreamEditorScreen.css';
import { SingleStreamEditor } from '../ui/SingleStreamEditor/SingleStreameEditor';
import { ToolbarCtx } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';

export function StreamEditor() {
    const session = useStreamEditorSession();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                session.onEscape();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [session]);

    const currentMode = useMemo(() => session.currentStack.mode.kind, [session.currentStack]);

    const toolbarProps: ToolbarCtx = {
        canSave: session.isDirty && !session.isLoading && session.isValid,
        saving: session.isSaving,
        save: session.save,
        exit: session.onEscape,
        onDelete: () => session.delStream(session.selectedStreamId ?? ''),
        addBlock: session.addBlock,
        tags: session.draft.tags,
        onChangeTags: session.updateTags,
    };

    const [filter, setFilter] = useState<StreamFilterState>(DEFAULT_STREAM_FILTER);

    const updateFilter = (patch: Partial<StreamFilterState>) => {
        setFilter((prev) => ({ ...prev, ...patch }));
    };

    const filtered = useMemo(
        () => applyStreamFilter(session.streamsIndex, filter),
        [session.streamsIndex, filter],
    );
    const handleOnClick = useCallback(
        (id: string) => {
            session.selectStream(id);
        },
        [session],
    );

    switch (currentMode) {
        case 'select':
            return (
                <div className="se">
                    <ScreenHeaderRow
                        left={<h1 className="se__title">Streams</h1>}
                        right={<StreamFilterControl filter={filter} updateFilter={updateFilter} />}
                    />
                    <div className="se__grid">
                        <NewStreamComponent createNewStream={session.createNewStream} />
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
                            {session.currentStack.mode.kind === 'error'
                                ? session.currentStack.mode.message
                                : ''}
                        </p>
                        <button className="se__error-ok" onClick={session.onEscape}>
                            OK
                        </button>
                    </div>
                </div>
            );
        case 'edit':
            return (
                <div className="se">
                    <SingleStreamEditor
                        stream={session.draft}
                        threeDotMenu={session.threeDotHandler}
                        editBlock={session.editBlock}
                        toolbarProps={toolbarProps}
                    />
                </div>
            );
    }
}
// We have two ways to handle streams:
// 1. Select stream from list to edit (however create new one)
//      Here we need control panel create and list of existing streams to select
// !!!! We need stream metadata editor form:
//          - title
//          - status
//          - tags
//          - description
// 2. Threat to selected stream: add/insert/change order/delete blocks/edit metadata
//          - add -> on the end/position number by button or
//                -> on the insert tag on the stream feed
//      reorder could be subMode of edit
