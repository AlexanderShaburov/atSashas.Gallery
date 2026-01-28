// src/shared/state/useEditorSessionsDataStore.ts

import type { EditorKey } from '@/shared/nav';
import { useMemo, useSyncExternalStore } from 'react';
import type { DraftSnapshot } from './editorSessionsData.store';
import { editSessionsDataStore } from './editorSessionsData.store';
type SessionActions<T> = {
    setDraft: (next: T) => void;
    setSnapshot: (next: T) => void;
    commit: () => void;
    clear: () => void;
};

function useDataStore<T>(key?: EditorKey): DraftSnapshot<T> | undefined {
    return useSyncExternalStore(
        (cb) => {
            if (!key) return () => {};
            return editSessionsDataStore.subscribe(cb);
        },
        () => (key ? editSessionsDataStore.get<T>(key) : undefined),
        () => (key ? editSessionsDataStore.get<T>(key) : undefined),
    );
}

export function useSessionDataStore<T>(
    key?: EditorKey,
): { storeData: DraftSnapshot<T> | undefined } & SessionActions<T> {
    const storeData = useDataStore<T>(key);

    const actions = useMemo<SessionActions<T>>(() => {
        if (!key) {
            return {
                setDraft: () => {},
                setSnapshot: () => {},
                commit: () => {},
                clear: () => {},
            };
        }
        return {
            setDraft: (next: T) => editSessionsDataStore.saveDraft<T>(key, next),
            setSnapshot: (next: T) => editSessionsDataStore.setSnapshot<T>(key, next),
            commit: () => editSessionsDataStore.commit<T>(key),
            clear: () => editSessionsDataStore.clear(key),
        };
    }, [key]);
    return { storeData, ...actions };
}
