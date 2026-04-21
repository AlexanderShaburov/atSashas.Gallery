---
type: pattern
scope: [state, editor]
status: active
date: 2026-04-18
source_of_truth: true
tags: [stores, editing]
---

# Draft/Snapshot pattern for editor sessions

## Problem

Editors need to track in-progress changes, detect dirty state, support discard, and commit changes on save. This must work across mount/unmount cycles.

## Solution

Every editor session maintains two copies of its data in `EditSessionsDataStore`:

```
┌──────────┐    edit     ┌──────────┐    save     ┌──────────┐
│ Snapshot  │───────────▶│  Draft   │────────────▶│  Server  │
│ (saved)   │◀───────────│ (editing)│◀────────────│  (JSON)  │
└──────────┘   discard   └──────────┘   refresh   └──────────┘
```

- **Snapshot** = last persisted state
- **Draft** = current in-memory edits
- **isDirty** = `deepEqual(draft, snapshot) === false`
- **commit()** = promote draft → snapshot (called after successful API save)

## Store API

`EditSessionsDataStore` (location: `shared/state/editorSessionsData.store.ts`):

```ts
get<T>(key: EditorKey | undefined): DraftSnapshot<T> | undefined
ensure<T>(key: EditorKey, initial: DraftSnapshot<T>): DraftSnapshot<T>
saveDraft<T>(key: EditorKey, draft: T): void
setSnapshot<T>(key: EditorKey, snapshot: T): void
commit<T>(key: EditorKey): void       // draft becomes new snapshot
clear(key: EditorKey): void
clearKind(kind: EditorKind): void
```

Data shape: `DraftSnapshot<T> = { snapshot: T; draft: T; updatedAt: string }`

## Store API side effects (load-bearing)

`setSnapshot(key, data)` is **not a pure snapshot setter**. Its implementation
writes a fresh `DraftSnapshot<T>` with BOTH `snapshot` AND `draft` set to
`data` (see `editorSessionsData.store.ts`). Calling it mid-session clobbers
any pending draft.

Consequence: when an editor's bootstrap needs to refresh the snapshot from
the server **and** preserve an in-flight draft (e.g., across route
transitions or after a Journey return), it MUST:

1. Capture the existing draft **before** calling `setSnapshot`:
   ```ts
   const inMemoryDraft = editSessionsDataStore.get<T>(key)?.draft;
   // ...optional: restore from localStorage if inMemoryDraft is undefined...
   editSessionsDataStore.setSnapshot<T>(key, serverDoc); // clobbers draft
   const base = inMemoryDraft ?? serverDoc;
   // apply effects, then:
   editSessionsDataStore.saveDraft<T>(key, nextDraft);
   ```

2. Reading after `setSnapshot` yields the clobbered value (`doc`), not the
   prior draft. Reading after is the silent-data-loss failure mode.

Rule of thumb: **read first, then `setSnapshot`, then `saveDraft`**.

## Cross-reload persistence (optional)

`EditSessionsDataStore` is in-memory only. A hard page reload wipes it.
Editors that must preserve drafts across reloads wrap their save/discard
flow with a dedicated `localStorage` key.

### Write path — subscribe directly to the store, not React state

Persistence MUST NOT be driven by a
`useEffect([draft, isDirty])` effect. During bootstrap, `setSnapshot(doc)`
creates a transient `{snapshot:doc, draft:doc}` state where `isDirty`
is briefly false; an effect keyed on dirty transitions can observe this
window and remove the persisted key before the real draft is restored
by the following `saveDraft(...)`.

The correct shape:

```ts
useEffect(() => {
  const sync = () => {
    const data = editSessionsDataStore.get<T>(key);
    if (!data) return;
    const dirty = !deepEqual(data.snapshot, data.draft);
    if (!dirty) return;            // never auto-remove here
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.draft));
  };
  return editSessionsDataStore.subscribe(sync);
}, []);
```

Key properties:

* Subscribes directly to the store. Not governed by React render batching.
* Only **writes** when the store is dirty. Never removes.
* Removal is the explicit responsibility of `save()` (after a successful
  PUT + `commit()`) and `discard()` (when reverting to snapshot). This
  avoids any dependency on transient dirty-flag transitions.

### Read path — bootstrap restore

On bootstrap, try `localStorage` only when the in-memory store is empty
(i.e., after a hard reload). See the bootstrap read-order rule above —
capture the in-memory draft first, then try `localStorage`, then call
`setSnapshot(doc)`, then `saveDraft(nextDraft)`.

### Accepted edge case

If a user manually edits then reverts back to the server state, the
draft matches snapshot but `localStorage` still holds the last
dirty write. A subsequent reload restores a draft whose content
happens to equal the server's; `isDirty` is correctly false. Net
effect: a harmless stale entry. Explicit save or discard cleans it up.

Currently used by: Homepage Editor (`__home_doc_draft`). See
`spec--editor--homepage-editor-behavior.md` for the full lifecycle.
Other editors do not persist across reload.

## React hook

```ts
const { storeData, setDraft, setSnapshot, commit, clear } = useSessionDataStore<T>(key);
```

## Keying

Sessions are keyed by `EditorKey = { kind: EditorKind; id: string }`.

## Where it applies

- Block editor, Stream editor, Catalog editor, Event editor, Media editor, EventPage editor, TextVisual editor

## Related

- [State management](../architecture/architecture--state--custom-pubsub-stores.md)
- [No global data in contexts](../invariants/invariant--state--no-global-data-in-react-contexts.md)
