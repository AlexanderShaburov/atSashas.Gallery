// src/features/admin/shared/EditorSessionCache/editorSessionCache.store.ts

import type { StreamData } from '@/entities/stream';

import { Block } from '@/entities/block';
import { ArtCatalog } from '@/entities/catalog';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import type {
    BlockEditEntry,
    CatalogEditEntry,
    EditCacheEntry,
    EditorKind,
    StreamEditEntry,
} from './jumpCache.types';

type CacheKey = string; // "stream:<id>" | "block:<id>" | "catalog:<id>"

type Listener = () => void;

function nowIso(): string {
    return new Date().toISOString();
}
function makeKey(kind: EditorKind, id: string): CacheKey {
    return `${kind}:${id}`;
}

export class EditorSessionCacheStore {
    private cache = new Map<CacheKey, EditCacheEntry>();
    private listeners = new Set<Listener>();

    // --- subscriptions ---------------------------------------------------------
    _subscribe = (fn: Listener): (() => void) => {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    };

    private emit(): void {
        for (const fn of this.listeners) fn();
    }

    // --- low-level getters -----------------------------------------------------
    getEntry(key: CacheKey): EditCacheEntry | undefined {
        return this.cache.get(key);
    }

    getStream(id: string): StreamEditEntry | undefined {
        const e = this.cache.get(makeKey('stream', id));
        return e?.kind === 'stream' ? e : undefined;
    }

    getBlock(id: string): BlockEditEntry | undefined {
        const e = this.cache.get(makeKey('block', id));
        return e?.kind === 'block' ? e : undefined;
    }

    getCatalog(id: string): CatalogEditEntry | undefined {
        const e = this.cache.get(makeKey('catalog', id));
        return e?.kind === 'catalog' ? e : undefined;
    }

    // --- ensure/create ---------------------------------------------------------
    ensureStream(id: string, snapshot: StreamData): StreamEditEntry {
        const key = makeKey('stream', id);
        const existing = this.cache.get(key);
        if (existing?.kind === 'stream') return existing;

        const created: StreamEditEntry = {
            kind: 'stream',
            id,
            data: { snapshot, draft: snapshot, updatedAt: nowIso() },
            ui: {},
        };
        this.cache.set(key, created);
        this.emit();
        return created;
    }

    ensureBlock(id: string, snapshot: Block): BlockEditEntry {
        const key = makeKey('block', id);
        const existing = this.cache.get(key);
        if (existing?.kind === 'block') return existing;

        const created: BlockEditEntry = {
            kind: 'block',
            id,
            data: { snapshot, draft: snapshot, updatedAt: nowIso() },
        };
        this.cache.set(key, created);
        this.emit();
        return created;
    }
    // Create new cache entry with draft === snapshot or (and) if already exists return ti
    ensureCatalog(id: string, snapshot: ArtCatalog): CatalogEditEntry {
        const key = makeKey('catalog', id);
        const existing = this.cache.get(key);
        if (existing?.kind === 'catalog') return existing;

        const created: CatalogEditEntry = {
            kind: 'catalog',
            id,
            data: { snapshot, draft: snapshot, updatedAt: nowIso() },
        };
        this.cache.set(key, created);
        this.emit();
        return created;
    }

    // --- updates ---------------------------------------------------------------
    updateStreamDraft(id: string, updater: (draft: StreamData) => StreamData): void {
        const key = makeKey('stream', id);
        const e = this.cache.get(key);
        if (!e || e.kind !== 'stream') return;

        const nextDraft = updater(e.data.draft);
        if (deepEqual(nextDraft, e.data.draft)) return;
        const next: StreamEditEntry = {
            ...e,
            data: { ...e.data, draft: nextDraft, updatedAt: nowIso() },
        };
        this.cache.set(key, next);
        this.emit();
    }
    updateBlockDraft(id: string, updater: (draft: Block) => Block): void {
        const key = makeKey('block', id);
        const e = this.cache.get(key);
        if (!e || e.kind !== 'block') return;

        const nextDraft = updater(e.data.draft);
        if (deepEqual(nextDraft, e.data.draft)) return;

        const next: BlockEditEntry = {
            ...e,
            data: { ...e.data, draft: nextDraft, updatedAt: nowIso() },
        };
        this.cache.set(key, next);
        this.emit();
    }

    updateCatalogDraft(id: string, updater: (draft: ArtCatalog) => ArtCatalog): void {
        const key = makeKey('catalog', id);
        const e = this.cache.get(key);
        if (!e || e.kind !== 'catalog') return;

        const nextDraft = updater(e.data.draft);
        if (deepEqual(nextDraft, e.data.draft)) return;

        const next: CatalogEditEntry = {
            ...e,
            data: { ...e.data, draft: nextDraft, updatedAt: nowIso() },
        };
        this.cache.set(key, next);
        this.emit();
    }
    // --- UI hints --------------------------------------------------------------

    setStreamUi(id: string, uiPatch: Partial<NonNullable<StreamEditEntry['ui']>>): void {
        const key = makeKey('stream', id);
        const e = this.cache.get(key);
        if (!e || e.kind !== 'stream') return;

        const next: StreamEditEntry = {
            ...e,
            ui: { ...(e.ui ?? {}), ...uiPatch },
            data: { ...e.data, updatedAt: nowIso() },
        };
        this.cache.set(key, next);
        this.emit();
    }

    // -- dirty / lifecycle ----------------------------------------------
    isDirty(kind: EditorKind, id: string): boolean {
        const e = this.cache.get(makeKey(kind, id));
        if (!e) return false;

        // Replace with deepEqual(normalize(...)) if you want.
        return !deepEqual(e.data.draft, e.data.snapshot);
    }

    hasAnyDirty(): boolean {
        for (const e of this.cache.values()) {
            if (!deepEqual(e.data.draft, e.data.snapshot)) return true;
        }
        return false;
    }

    commit(kind: EditorKind, id: string): void {
        // Call this after you successfully saved draft to disk/server.
        const key = makeKey(kind, id);
        const e = this.cache.get(key);
        if (!e) return;

        const next: EditCacheEntry = {
            ...e,
            data: { ...e.data, snapshot: e.data.draft, updatedAt: nowIso() },
        } as EditCacheEntry;

        this.cache.set(key, next);
        this.emit();
    }

    clear(kind: EditorKind, id: string): void {
        const key = makeKey(kind, id);
        if (!this.cache.has(key)) return;
        this.cache.delete(key);
        this.emit();
    }

    clearAll(): void {
        if (this.cache.size === 0) return;
        this.cache.clear();
        this.emit();
    }

    prune(options?: { maxEntries?: number; keepDirty?: boolean }): void {
        const maxEntries = options?.maxEntries ?? 10;
        const keepDirty = options?.keepDirty ?? true;

        if (this.cache.size <= maxEntries) return;

        // Sort by updatedAt ascending (oldest first)
        const entries = Array.from(this.cache.entries()).sort((a, b) => {
            const ta = Date.parse(a[1].data.updatedAt);
            const tb = Date.parse(b[1].data.updatedAt);
            return ta - tb;
        });

        for (const [key, e] of entries) {
            if (this.cache.size <= maxEntries) break;

            const dirty = !deepEqual(e.data.draft, e.data.snapshot);
            if (keepDirty && dirty) continue;

            this.cache.delete(key);
        }

        this.emit();
    }

    // --- snapshots for useSyncExternalStore -----------------------------------

    getSnapshot(): { size: number; anyDirty: boolean } {
        return { size: this.cache.size, anyDirty: this.hasAnyDirty() };
    }

    // Helpers

    getStreamSnapshot(id: string): StreamEditEntry | undefined {
        return this.getStream(id);
    }

    getBlockSnapshot(id: string): BlockEditEntry | undefined {
        return this.getBlock(id);
    }
}

export const editorSessionCache = new EditorSessionCacheStore();
