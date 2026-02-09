// src/shared/state/useEditorSessionsDataStore.ts
import { useMemo, useSyncExternalStore } from 'react';
import { editSessionsDataStore } from './editorSessionsData.store';
function useDataStore(key) {
    return useSyncExternalStore((cb) => {
        if (!key)
            return () => { };
        return editSessionsDataStore.subscribe(cb);
    }, () => (key ? editSessionsDataStore.get(key) : undefined), () => (key ? editSessionsDataStore.get(key) : undefined));
}
export function useSessionDataStore(key) {
    const storeData = useDataStore(key);
    const actions = useMemo(() => {
        if (!key) {
            return {
                setDraft: () => { },
                setSnapshot: () => { },
                commit: () => { },
                clear: () => { },
            };
        }
        return {
            setDraft: (next) => editSessionsDataStore.saveDraft(key, next),
            setSnapshot: (next) => editSessionsDataStore.setSnapshot(key, next),
            commit: () => editSessionsDataStore.commit(key),
            clear: () => editSessionsDataStore.clear(key),
        };
    }, [key]);
    return { storeData, ...actions };
}
