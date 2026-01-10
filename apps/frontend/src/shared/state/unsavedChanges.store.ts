// src/shared/state/unsavedChanges.store.ts

type Listener = () => void;

type DirtyScope = 'blocks' | 'streams' | 'catalog' | 'hopper' | string;

class UnsavedChangesStore {
    private dirty = new Map<DirtyScope, boolean>(); // ??????
    private listeners = new Set<Listener>();

    setDirty(scope: DirtyScope, v: boolean): void {
        const prev = this.dirty.get(scope) ?? false;
        if (prev === v) return;

        this.dirty.set(scope, v);
        this.emit();
    }

    isDirty(scope?: DirtyScope): boolean {
        if (!scope) {
            for (const v of this.dirty.values()) if (v) return true;
            return false;
        }
        return this.dirty.get(scope) ?? false;
    }

    clear(scope?: DirtyScope): void {
        if (!scope) this.dirty.clear();
        else this.dirty.delete(scope);
        this.emit();
    }

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit(): void {
        for (const fn of this.listeners) fn();
    }
}

export const unsavedChangesStore = new UnsavedChangesStore();
