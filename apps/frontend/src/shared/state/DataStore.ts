// src/shared/state/DataStore.ts

import { BaseStore } from './baseStore';

/**
 * Generic typed container extending BaseStore.
 * Holds a single value of type T with pub/sub notification.
 * Used as the data-plane store for domain collections.
 */
export class DataStore<T> extends BaseStore {
    private data: T | undefined = undefined;

    get(): T | undefined {
        return this.data;
    }

    set(value: T): void {
        this.data = value;
        this.emit();
    }

    clear(): void {
        this.data = undefined;
        this.emit();
    }

    /** Bound snapshot getter for useSyncExternalStore */
    getSnapshot = (): T | undefined => {
        return this.data;
    };
}
