// src/shared/state/useUnsavedChanged.ts

import { useSyncExternalStore } from 'react';
import { unsavedChangesStore } from './unsavedChanges.store';

export function useAnyUnsavedChanges(): boolean {
    return useSyncExternalStore(
        (cb) => unsavedChangesStore.subscribe(cb),
        () => unsavedChangesStore.isDirty(),
        () => unsavedChangesStore.isDirty(),
    );
}

export function useUnsavedChanges(scope: string): boolean {
    return useSyncExternalStore(
        (cb) => unsavedChangesStore.subscribe(cb),
        () => unsavedChangesStore.isDirty(scope),
        () => unsavedChangesStore.isDirty(scope),
    );
}
