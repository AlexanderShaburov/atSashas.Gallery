// src/shared/ui/ThreeDotMenu/useThreeDotController.ts
import { useCallback, useMemo, useState } from 'react';
import type { ThreeDotAction, ThreeDotCommand, ThreeDotOwner } from './threeDot.types';

export type ThreeDotAnchor = { rect: DOMRect };

type State = {
    isOpen: boolean;
    owner: ThreeDotOwner | null;
    anchor: ThreeDotAnchor | null;
};

export function useThreeDotController<AnchorParams extends object>(opts: {
    buildOwner: (params: AnchorParams) => ThreeDotOwner;
    onCommand: (cmd: ThreeDotCommand) => void;
    // optional: if you want custom owner equality for toggle
    isSameOwner?: (a: ThreeDotOwner, b: ThreeDotOwner) => boolean;
}) {
    const [state, setState] = useState<State>({ isOpen: false, owner: null, anchor: null });

    const close = useCallback(() => {
        setState({ isOpen: false, owner: null, anchor: null });
    }, []);

    const open = useCallback(
        (params: AnchorParams & { rect: DOMRect }) => {
            setState({
                isOpen: true,
                owner: opts.buildOwner(params),
                anchor: { rect: params.rect },
            });
        },
        [opts],
    );

    const toggleFromEvent = useCallback(
        (params: AnchorParams & { el: HTMLElement }) => {
            const rect = params.el.getBoundingClientRect();

            setState((prev) => {
                const nextOwner = opts.buildOwner(params);

                const same =
                    prev.isOpen &&
                    prev.owner &&
                    (opts.isSameOwner
                        ? opts.isSameOwner(prev.owner, nextOwner)
                        : shallowSameOwner(prev.owner, nextOwner));

                if (same) return { isOpen: false, owner: null, anchor: null };

                return { isOpen: true, owner: nextOwner, anchor: { rect } };
            });
        },
        [opts],
    );

    const select = useCallback(
        (action: ThreeDotAction) => {
            setState((prev) => {
                if (!prev.isOpen || !prev.owner) return prev;

                const cmd: ThreeDotCommand = { owner: prev.owner, action };

                // Close first, then run
                queueMicrotask(() => opts.onCommand(cmd));

                return { isOpen: false, owner: null, anchor: null };
            });
        },
        [opts],
    );

    return useMemo(
        () => ({
            state,
            open,
            close,
            toggleFromEvent,
            select,
        }),
        [state, open, close, toggleFromEvent, select],
    );
}

function shallowSameOwner(a: ThreeDotOwner, b: ThreeDotOwner): boolean {
    if (a.kind !== b.kind) return false;
    switch (a.kind) {
        case 'stream':
            return b.kind === 'stream' && a.streamId === b.streamId && a.blockId === b.blockId;
        case 'block':
            return b.kind === 'block' && a.blockId === b.blockId && a.artId === b.artId;
        case 'blockCollection':
            return b.kind === 'blockCollection' && a.blockId === b.blockId;
        case 'catalog':
            return b.kind === 'catalog' && a.artId === b.artId;
        default:
            return false;
    }
}
