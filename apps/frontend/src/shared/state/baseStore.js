// src/shared/state/baseStore.ts
export class BaseStore {
    constructor() {
        this.listeners = new Set();
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    emit() {
        for (const fn of this.listeners)
            fn();
    }
}
