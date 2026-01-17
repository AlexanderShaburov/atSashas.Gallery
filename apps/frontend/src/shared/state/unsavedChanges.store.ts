// src/shared/state/unsavedChanges.store.ts

import type { EditorKey } from '@/shared/nav';
import { BaseStore } from './baseStore';

class UnsavedChangesStore extends BaseStore {
    private dirty = new Map<EditorKey, boolean>();

    setDirty(scope: EditorKey, v: boolean): void {
        const prev = this.dirty.get(scope) ?? false;
        if (prev === v) return;

        this.dirty.set(scope, v);
        this.emit();
    }

    isDirty(scope?: EditorKey): boolean {
        if (!scope) {
            for (const v of this.dirty.values()) if (v) return true;
            return false;
        }
        return this.dirty.get(scope) ?? false;
    }

    clear(scope?: EditorKey): void {
        if (!scope) this.dirty.clear();
        else this.dirty.delete(scope);
        this.emit();
    }
}

export const unsavedChangesStore = new UnsavedChangesStore();
