// src/shared/state/useUnsavedChanged.ts
import { useSyncExternalStore } from 'react';
import { unsavedChangesStore } from './unsavedChanges.store';
export function useAnyUnsavedChanges() {
    return useSyncExternalStore((cb) => unsavedChangesStore.subscribe(cb), () => unsavedChangesStore.isDirty(), () => unsavedChangesStore.isDirty());
}
export function useUnsavedChanges(scope) {
    return useSyncExternalStore((cb) => unsavedChangesStore.subscribe(cb), () => unsavedChangesStore.isDirty(scope), () => unsavedChangesStore.isDirty(scope));
}
