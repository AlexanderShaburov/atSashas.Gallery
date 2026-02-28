// src/shared/state/useStoreData.ts

import { useSyncExternalStore } from 'react';
import type { DataStore } from './DataStore';

/**
 * React hook that subscribes to a DataStore<T> via useSyncExternalStore.
 * Returns T | undefined.
 */
export function useStoreData<T>(store: DataStore<T>): T | undefined {
    return useSyncExternalStore(
        (cb) => store.subscribe(cb),
        store.getSnapshot,
        store.getSnapshot,
    );
}
