//src/shared/state/editorSessionsData.store.ts
import { BaseStore } from './baseStore';
function keyToString(key) {
    return `${key.kind}:${key.id}`;
}
class EditSessionsDataStore extends BaseStore {
    constructor() {
        super(...arguments);
        this.sessions = new Map();
    }
    get(key) {
        if (!key)
            return undefined;
        const entry = this.sessions.get(keyToString(key));
        return entry?.data;
    }
    ensure(key, initial) {
        console.log(`[EditSessionsDataStore]: Called`);
        const k = keyToString(key);
        console.log(`[EditSessionsDataStore]: key assigned as ${key}`);
        const existing = this.sessions.get(k);
        if (existing)
            return existing.data;
        this.sessions.set(k, { key, data: initial });
        console.log(`[EditSessionsDataStore]: new entry set`);
        this.emit();
        return initial;
    }
    saveDraft(key, draft) {
        console.log(`[EditSessionsDataStore][saveDraft]: saveDraft called`);
        const k = keyToString(key);
        console.log(`[EditSessionsDataStore][saveDraft]: key calculated as ${k}`);
        const entry = this.sessions.get(k);
        const prev = entry?.data;
        const next = prev
            ? { ...prev, draft, updatedAt: new Date().toISOString() }
            : {
                snapshot: draft,
                draft,
                updatedAt: new Date().toISOString(),
            };
        this.sessions.set(k, { key, data: next });
        this.emit();
    }
    setSnapshot(key, snapshot) {
        const k = keyToString(key);
        const next = {
            snapshot,
            draft: snapshot,
            updatedAt: new Date().toISOString(),
        };
        this.sessions.set(k, { key, data: next });
        this.emit();
    }
    commit(key) {
        const k = keyToString(key);
        const entry = this.sessions.get(k);
        if (!entry)
            return;
        const prev = entry.data;
        const next = {
            snapshot: prev.draft,
            draft: prev.draft,
            updatedAt: new Date().toISOString(),
        };
        this.sessions.set(k, { key, data: next });
        this.emit();
    }
    clear(key) {
        const k = keyToString(key);
        if (!this.sessions.has(k))
            return;
        this.sessions.delete(k);
        this.emit();
    }
    clearKind(kind) {
        let changed = false;
        for (const [k, entry] of this.sessions.entries()) {
            if (entry.key.kind === kind) {
                this.sessions.delete(k);
                changed = true;
            }
        }
        if (changed)
            this.emit();
    }
}
export const editSessionsDataStore = new EditSessionsDataStore();
