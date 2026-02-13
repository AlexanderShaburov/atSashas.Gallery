// src/shared/state/useDestructiveActionsStore.ts

import { useSyncExternalStore } from 'react';
import { destructiveActionsStore } from './destructiveActions.store';

export function useDestructiveActionsStore() {
    return useSyncExternalStore(
        (cb) => destructiveActionsStore.subscribe(cb),
        () => destructiveActionsStore.getSnapshot(),
        () => destructiveActionsStore.getSnapshot(),
    );
}
