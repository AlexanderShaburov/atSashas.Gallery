import type { EditorKey, EditorKind } from '@/shared/nav';
import { BaseStore } from './baseStore';

export type DraftSnapshot<T> = {
    snapshot: T;
    draft: T;
    updatedAt: string;
};

type AnyEntry = {
    key: EditorKey;
    data: DraftSnapshot<unknown>;
};

function keyToString(key: EditorKey): string {
    return `${key.kind}:${key.id}`;
}

class EditSessionsDataStore extends BaseStore {
    private sessions = new Map<string, AnyEntry>();

    get<T>(key: EditorKey): DraftSnapshot<T> | undefined {
        const entry = this.sessions.get(keyToString(key));
        return entry?.data as DraftSnapshot<T> | undefined;
    }

    ensure<T>(key: EditorKey, initial: DraftSnapshot<T>): DraftSnapshot<T> {
        const k = keyToString(key);
        const existing = this.sessions.get(k);
        if (existing) return existing.data as DraftSnapshot<T>;

        this.sessions.set(k, { key, data: initial as DraftSnapshot<unknown> });
        this.emit();
        return initial;
    }
    saveDraft<T>(key: EditorKey, draft: T): void {
        console.log(`[EditSessionsDataStore][saveDraft]: saveDraft called`);

        const k = keyToString(key);
        console.log(`[EditSessionsDataStore][saveDraft]: key calculated as ${k}`);
        const entry = this.sessions.get(k);
        if (!entry) return;

        entry.data = {
            ...(entry.data as DraftSnapshot<T>),
            draft,
            updatedAt: new Date().toISOString(),
        } as DraftSnapshot<unknown>;
        console.log(`[EditSessionsDataStore][saveDraft]: current draftSnapshot is:`);
        console.dir(this.sessions.get(k));
        this.emit();
    }
    setSnapshot<T>(key: EditorKey, snapshot: T): void {
        const k = keyToString(key);
        const entry = this.sessions.get(k);
        if (!entry) return;

        entry.data = {
            snapshot,
            draft: snapshot, //  snapshot == draft
            updatedAt: new Date().toISOString(),
        } as DraftSnapshot<unknown>;
        console.log(`[EditSessionsDataStore][setSnapshot]: setSnapshot called`);
        console.log(`[EditSessionsDataStore][setSnapshot]: current draftSnapshot is:`);
        console.dir(this.sessions.get(k));

        this.emit();
    }
    commit<T>(key: EditorKey): void {
        const k = keyToString(key);
        const entry = this.sessions.get(k);
        if (!entry) return;

        const prev = entry.data as DraftSnapshot<T>;
        entry.data = {
            snapshot: prev.draft,
            draft: prev.draft,
            updatedAt: new Date().toISOString(),
        } as DraftSnapshot<unknown>;

        this.emit();
    }

    clear(key: EditorKey): void {
        const k = keyToString(key);
        if (!this.sessions.has(k)) return;
        this.sessions.delete(k);
        this.emit();
    }

    clearKind(kind: EditorKind): void {
        let changed = false;
        for (const [k, entry] of this.sessions.entries()) {
            if (entry.key.kind === kind) {
                this.sessions.delete(k);
                changed = true;
            }
        }
        if (changed) this.emit();
    }
}

export const editSessionsDataStore = new EditSessionsDataStore();
