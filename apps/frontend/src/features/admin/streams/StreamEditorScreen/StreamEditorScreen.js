import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ScreenHeaderRow } from '@/features/admin/shared/ui/ScreenHeaderRow';
import { useStreamEditorSession } from '@/features/admin/streams/hooks/useStreamEditor';
import { applyStreamFilter } from '@/features/admin/streams/ui/FilterControl/applyStreamFilter';
import { DEFAULT_STREAM_FILTER } from '@/features/admin/streams/ui/FilterControl/streamFilter.defaults';
import { StreamFilterControl } from '@/features/admin/streams/ui/FilterControl/StreamFilterControl';
import { NewStreamComponent, StreamMetaComponent, } from '@/features/admin/streams/ui/NewStreamComponent';
import { SingleStreamEditor } from '@/features/admin/streams/ui/SingleStreamEditor/SingleStreamEditor';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './StreamEditorScreen.css';
export function StreamEditor() {
    const session = useStreamEditorSession();
    const { draft, isDirty, isLoading, isValid, isSaving, save, onEscape, delStream, selectedStreamId, addBlock, updateTags, streamsIndex, selectStream, createNewStream, threeDotHandler, editBlock, currentStack, commitMetaEditor, editMetadata, } = session;
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (e.defaultPrevented)
                    return;
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
    const toolbarProps = useMemo(() => {
        if (!draft)
            return null;
        console.log(`[StreamEditor] toolbarProps calculator. `);
        console.log(`[StreamEditor] isDirty: ${isDirty} `);
        console.log(`[StreamEditor] isLoading: ${isLoading} `);
        console.log(`[StreamEditor] isValid: ${isValid} `);
        return {
            canSave: isDirty && !isLoading && isValid,
            isSaving,
            tags: draft.tags,
            onAdd: addBlockFromToolbar,
            onEdit: editMetadata,
            onDelete: () => delStream(selectedStreamId ?? ''),
            save,
            exit: onEscape,
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
        updateTags,
        addBlockFromToolbar,
        editMetadata,
    ]);
    const initial = {
        streamId: draft?.streamId ?? '',
        title: draft?.title ?? '',
        tags: draft?.tags ?? [],
        description: draft?.description ?? '',
    };
    const [filter, setFilter] = useState(DEFAULT_STREAM_FILTER);
    const updateFilter = useCallback((patch) => {
        setFilter((prev) => ({ ...prev, ...patch }));
    }, []);
    const filtered = useMemo(() => applyStreamFilter(streamsIndex, filter), [streamsIndex, filter]);
    const handleOnClick = useCallback(async (id) => {
        await selectStream(id);
    }, [selectStream]);
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
            return (_jsxs("div", { className: "se", children: [_jsx(ScreenHeaderRow, { left: _jsx("h1", { className: "se__title", children: "Streams" }), right: _jsx(StreamFilterControl, { filter: filter, updateFilter: updateFilter }) }), _jsxs("div", { className: "se__grid", children: [_jsx(NewStreamComponent, { createNewStream: createNewStream }), filtered.map((s) => (_jsxs("figure", { className: "se__thumbnail", role: "button", tabIndex: 0, onClick: () => handleOnClick(s.streamId), onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                        handleOnClick(s.streamId);
                                }, children: [_jsx("img", { src: s.thumbnail, loading: "lazy" }), _jsx("figcaption", { children: s.title ?? '' })] }, s.streamId)))] })] }));
        case 'error':
            return (_jsx("div", { className: "se", children: _jsxs("div", { className: "se__error-screen", children: [_jsx("p", { className: "se__error-message", children: currentStack.mode.kind === 'error' ? currentStack.mode.message : '' }), _jsx("button", { className: "se__error-ok", onClick: onEscape, children: "OK" })] }) }));
        case 'edit': {
            if (!draft || !toolbarProps) {
                // optional: show loading/placeholder instead of null
                return (_jsx("div", { className: "se", children: _jsx("div", { className: "se__loading", children: "Loading\u2026" }) }));
            }
            return (_jsx("div", { className: "se", children: _jsx(SingleStreamEditor, { stream: draft, threeDotMenu: threeDotHandler, editBlock: editBlock, toolbarProps: toolbarProps }) }));
        }
        case 'meta':
            return (_jsxs("div", { className: "se", children: [_jsx(ScreenHeaderRow, { left: _jsx("h1", { className: "se__title", children: "Streams" }), right: null }), _jsx(StreamMetaComponent, { initial: initial, onCancel: onEscape, onSubmit: commitMetaEditor, isLoading: isLoading })] }));
        default:
            return null;
    }
}
