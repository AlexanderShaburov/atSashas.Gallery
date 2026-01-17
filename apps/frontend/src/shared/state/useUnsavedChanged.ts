// src/shared/state/useUnsavedChanged.ts

import { EditorKey } from '@/shared/nav';
import { useSyncExternalStore } from 'react';
import { unsavedChangesStore } from './unsavedChanges.store';

export function useAnyUnsavedChanges(): boolean {
    return useSyncExternalStore(
        (cb) => unsavedChangesStore.subscribe(cb),
        () => unsavedChangesStore.isDirty(),
        () => unsavedChangesStore.isDirty(),
    );
}

export function useUnsavedChanges(scope: EditorKey): boolean {
    return useSyncExternalStore(
        (cb) => unsavedChangesStore.subscribe(cb),
        () => unsavedChangesStore.isDirty(scope),
        () => unsavedChangesStore.isDirty(scope),
    );
}
