---
type: architecture
scope: [state]
status: active
date: 2026-04-18
source_of_truth: true
tags: [stores, state-management]
---

# State management: custom pub/sub stores

## Overview

The application uses a custom pub/sub store system — no Redux, Zustand, or similar libraries. Stores are external to React and serve as the data plane.

## Store hierarchy

```
BaseStore (abstract — subscribe/emit pub/sub)
  └── DataStore<T> (typed container — get/set/clear/getSnapshot)
       ├── catalogStore              DataStore<ArtCatalog>
       ├── blocksCollectionStore     DataStore<BlocksCollectionJSON>
       ├── streamsIndexStore         DataStore<StreamIndexItem[]>
       ├── eventsStore               DataStore<EventCatalog>
       ├── eventPagesStore           DataStore<EventPageCatalog>
       ├── mediaItemsStore           DataStore<MediaItemCatalog>
       └── textVisualsStore          DataStore<TextVisualCatalog>

  └── EditSessionsDataStore (keyed draft/snapshot per EditorKey)
       └── editSessionsDataStore     singleton

  └── UnsavedChangesStore (per-scope dirty flags)
       └── unsavedChangesStore       singleton

  └── DestructiveActionsStore (confirmation overlay state machine)
       └── destructiveActionsStore   singleton

JourneySessionStore (own subscribe/emit — does NOT extend BaseStore)
  └── journeySessionStore            singleton
      Location: shared/nav/journeySession.store.ts (NOT in shared/state/)
```

## BaseStore / DataStore pattern

Location: `shared/state/baseStore.ts`, `shared/state/DataStore.ts`

```ts
class BaseStore {
  private listeners: Set<Listener>;
  subscribe(fn: Listener): () => void;   // returns unsubscribe
  protected emit(): void;                 // notifies listeners
}

class DataStore<T> extends BaseStore {
  get(): T | undefined;
  set(value: T): void;
  clear(): void;
  getSnapshot = (): T | undefined;       // for useSyncExternalStore
}
```

## EditSessionsDataStore

Location: `shared/state/editorSessionsData.store.ts`

```ts
class EditSessionsDataStore extends BaseStore {
  get<T>(key: EditorKey | undefined): DraftSnapshot<T> | undefined;
  ensure<T>(key: EditorKey, initial: DraftSnapshot<T>): DraftSnapshot<T>;
  saveDraft<T>(key: EditorKey, draft: T): void;
  setSnapshot<T>(key: EditorKey, snapshot: T): void;   // writes BOTH snapshot AND draft = snapshot
  commit<T>(key: EditorKey): void;
  clear(key: EditorKey): void;
  clearKind(kind: EditorKind): void;
}

type DraftSnapshot<T> = { snapshot: T; draft: T; updatedAt: string };
```

**Important:** `setSnapshot(key, data)` clobbers the existing draft as a side
effect (it writes a fresh `DraftSnapshot<T>` with `draft: data`). Bootstraps
that need to preserve an in-flight draft must capture it **before** calling
`setSnapshot`. See the [Draft/snapshot pattern](../patterns/pattern--state--draft-snapshot.md)
for the correct read-order.

## React integration

```ts
// Read domain stores reactively
useStoreData<T>(store: DataStore<T>): T | undefined
  // Uses React.useSyncExternalStore internally

// Editor session data
useSessionDataStore<T>(key?: EditorKey): {
  storeData: DraftSnapshot<T> | undefined;
  setDraft(draft: T): void;
  setSnapshot(snapshot: T): void;
  commit(): void;
  clear(): void;
}

// Dirty tracking
useAnyUnsavedChanges(): boolean
useUnsavedChanges(scope: EditorKey): boolean

// Destructive actions
useDestructiveActionsStore(): DestructiveState
```

## EditorKey

Sessions are keyed by entity kind + ID:
```ts
type EditorKey = { kind: EditorKind; id: string }
```

## Related

- [No global data in React contexts](../invariants/invariant--state--no-global-data-in-react-contexts.md)
- [Bootstrap reads stores imperatively](../invariants/invariant--state--bootstrap-reads-stores-imperatively.md)
- [Draft/snapshot pattern](../patterns/pattern--state--draft-snapshot.md)
- [Custom pub/sub decision](../decisions/decision--state--custom-pubsub-over-redux.md)
