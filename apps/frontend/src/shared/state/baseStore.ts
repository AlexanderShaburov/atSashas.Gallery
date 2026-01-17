// src/shared/state/baseStore.ts

export type Listener = () => void;

export class BaseStore {
    private listeners = new Set<Listener>();

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    protected emit(): void {
        for (const fn of this.listeners) fn();
    }
}
