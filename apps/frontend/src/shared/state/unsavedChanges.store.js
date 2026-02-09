// src/shared/state/unsavedChanges.store.ts
import { BaseStore } from './baseStore';
class UnsavedChangesStore extends BaseStore {
    constructor() {
        super(...arguments);
        this.dirty = new Map();
    }
    setDirty(scope, v) {
        const prev = this.dirty.get(scope) ?? false;
        if (prev === v)
            return;
        this.dirty.set(scope, v);
        this.emit();
    }
    isDirty(scope) {
        if (!scope) {
            for (const v of this.dirty.values())
                if (v)
                    return true;
            return false;
        }
        return this.dirty.get(scope) ?? false;
    }
    clear(scope) {
        if (!scope)
            this.dirty.clear();
        else
            this.dirty.delete(scope);
        this.emit();
    }
}
export const unsavedChangesStore = new UnsavedChangesStore();
