// src/shared/ui/ThreeDotMenu/useThreeDotController.ts
import { useCallback, useMemo, useState } from 'react';
export function useThreeDotController(opts) {
    const [state, setState] = useState({ isOpen: false, owner: null, anchor: null });
    const close = useCallback(() => {
        setState({ isOpen: false, owner: null, anchor: null });
    }, []);
    const open = useCallback((params) => {
        setState({
            isOpen: true,
            owner: opts.buildOwner(params),
            anchor: { rect: params.rect },
        });
    }, [opts]);
    const toggleFromEvent = useCallback((params) => {
        const rect = params.el.getBoundingClientRect();
        setState((prev) => {
            const nextOwner = opts.buildOwner(params);
            const same = prev.isOpen &&
                prev.owner &&
                (opts.isSameOwner
                    ? opts.isSameOwner(prev.owner, nextOwner)
                    : shallowSameOwner(prev.owner, nextOwner));
            if (same)
                return { isOpen: false, owner: null, anchor: null };
            return { isOpen: true, owner: nextOwner, anchor: { rect } };
        });
    }, [opts]);
    const select = useCallback((action) => {
        setState((prev) => {
            if (!prev.isOpen || !prev.owner)
                return prev;
            const cmd = { owner: prev.owner, action };
            // Close first, then run
            queueMicrotask(() => opts.onCommand(cmd));
            return { isOpen: false, owner: null, anchor: null };
        });
    }, [opts]);
    return useMemo(() => ({
        state,
        open,
        close,
        toggleFromEvent,
        select,
    }), [state, open, close, toggleFromEvent, select]);
}
function shallowSameOwner(a, b) {
    if (a.kind !== b.kind)
        return false;
    switch (a.kind) {
        case 'stream':
            return b.kind === 'stream' && a.streamId === b.streamId && a.blockId === b.blockId;
        case 'block':
            return b.kind === 'block' && a.blockId === b.blockId && a.artId === b.artId;
        case 'catalog':
            return b.kind === 'catalog' && a.artId === b.artId;
        default:
            return false;
    }
}
