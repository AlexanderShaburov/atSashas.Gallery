# Dependency-Aware Deletion System - Implementation Status

## ✅ Completed - Phase 1: Core Infrastructure

### New Files Created

1. **`apps/frontend/src/shared/lib/dependencies/dependency.types.ts`**
   - Type definitions for dependency graph
   - `DependencyNode`, `DependencyEdge`, `DependencyTree`, `CascadePreview`

2. **`apps/frontend/src/shared/lib/dependencies/dependencyResolver.ts`**
   - Service for analyzing dependencies
   - `findArtItemDependents()` - finds blocks using an art item
   - `findBlockDependents()` - finds streams using a block
   - `buildArtItemDependencyTree()` - full dependency analysis
   - `buildBlockDependencyTree()` - block dependency analysis

3. **`apps/frontend/src/shared/lib/dependencies/index.ts`**
   - Barrel export for easy imports

4. **`apps/frontend/src/features/admin/shared/hooks/useJourneyGuard.ts`**
   - Hook to prevent actions during journey
   - `canStartDeletion()` - checks if deletion is allowed
   - `guardAction()` - wraps actions with guard check

### Files Modified

5. **`apps/frontend/src/shared/state/destructiveActions.store.ts`**
   - Added dependency-related types
   - New phases: `checking-dependencies`, `show-dependencies`
   - New job fields: `resolutionMode`, `dependencies`, `onNavigateToDependency`, `onCascadeDelete`
   - New methods: `setPhase()`, made `setState()` public

## ✅ Completed - Phase 2: UI Enhancement

### Files Modified

6. **`apps/frontend/src/features/admin/shared/ui/DestructiveOverlay/DestructiveOverlay.tsx`**
   - Shows dependency list with clickable items
   - Manual resolution: navigate to dependent
   - Cascade option with preview
   - Different UI for `show-dependencies` phase

7. **`apps/frontend/src/features/admin/shared/ui/DestructiveOverlay/DestructiveOverlay.css`**
   - Styles for dependency list
   - Styles for cascade warning
   - Interactive dependency item buttons

## ✅ Completed - Phase 3: Integration Examples

### New Files Created

8. **`apps/frontend/src/features/admin/catalogEditor/hooks/useDependencyAwareDeletion.ts`**
   - Complete hook for art item deletion with dependencies
   - Journey guard integration
   - Dependency analysis
   - Manual and cascade resolution

9. **`apps/frontend/src/features/admin/blocks/hooks/useDependencyAwareBlockDeletion.ts`**
   - Complete hook for block deletion with dependencies
   - Similar to art item deletion but for blocks

10. **`apps/frontend/src/shared/lib/dependencies/README.md`**
    - Comprehensive documentation
    - Usage examples
    - Architecture overview
    - Flow diagrams

## 🔄 TODO - Integration Tasks

### 1. Update EditorWorkspace Context

The `EditorWorkspaceContext` needs to expose:
- `streamsIndex: StreamIndexItem[]` - list of all streams
- `refreshCatalog()` - refresh art catalog after deletion
- `refreshBlocks()` - refresh blocks collection after deletion
- `refreshStreams()` - refresh streams index after deletion

**File:** `apps/frontend/src/features/admin/EditorWorkspace/EditorWorkspaceContext.tsx`

```typescript
// Add to EditorWorkspaceContextValue type
type EditorWorkspaceContextValue = {
  // ... existing fields
  streamsIndex: StreamIndexItem[] | null;
  refreshCatalog: () => Promise<void>;
  refreshBlocks: () => Promise<void>;
  refreshStreams: () => Promise<void>;
};
```

### 2. Integrate into Catalog Editor

Replace simple deletion with dependency-aware deletion:

**File:** `apps/frontend/src/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context.tsx`

```typescript
import { useDependencyAwareDeletion } from '../hooks/useDependencyAwareDeletion';

// In component:
const { deleteArtItem } = useDependencyAwareDeletion();

// Replace existing onDelete logic:
const onDelete = () => {
  deleteArtItem(draft); // Use dependency-aware deletion
};
```

### 3. Integrate into Block Editor

**File:** `apps/frontend/src/features/admin/blocks/blockEditorSession/BlockEditorSession.context.tsx`

```typescript
import { useDependencyAwareBlockDeletion } from '../hooks/useDependencyAwareBlockDeletion';

// In component:
const { deleteBlock: deleteBlockWithDeps } = useDependencyAwareBlockDeletion();

// Replace existing onDelete logic:
const onDelete = useCallback(() => {
  if (!draft) return;
  deleteBlockWithDeps(draft); // Use dependency-aware deletion
}, [draft, deleteBlockWithDeps]);
```

### 4. Handle Return Effect in Editors

When user returns from manual dependency resolution, need to handle `dependencyResolved` return effect:

**In Catalog Editor Bootstrap:**
```typescript
if (ticket.returnEffect?.kind === 'dependencyResolved') {
  // User fixed a dependency, re-analyze and show dialog again if needed
  const targetId = ticket.returnEffect.targetId;
  // Re-trigger dependency check...
}
```

**In Block Editor Bootstrap:**
```typescript
// Similar handling for block dependencies
```

### 5. Add Delete ArtItem API

Ensure catalog API has delete endpoint:

**File:** `apps/frontend/src/features/admin/catalogEditor/api/index.ts`

```typescript
export async function deleteArtItem(artId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/art_catalog/${artId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete art item: ${res.status}`);
}
```

### 6. Load Streams Index

Ensure streams index is loaded in EditorWorkspace:

```typescript
// In EditorWorkspace provider
const [streamsIndex, setStreamsIndex] = useState<StreamIndexItem[]>([]);

useEffect(() => {
  loadStreamsIndex();
}, []);

const refreshStreams = async () => {
  const index = await streamsApi.list();
  setStreamsIndex(index);
};
```

### 7. Test Each Scenario

- [ ] Delete art item with no dependencies (simple)
- [ ] Delete art item with block dependencies (show dialog)
- [ ] Manual resolution: click block → navigate → fix → return
- [ ] Cascade resolution: delete art + blocks + update streams
- [ ] Delete block with no stream dependencies (simple)
- [ ] Delete block with stream dependencies (show dialog)
- [ ] Manual resolution for block
- [ ] Cascade resolution for block
- [ ] Verify empty streams are deleted
- [ ] Verify non-empty streams are just updated
- [ ] Try to delete during active journey (should block)

## 📝 Backend Requirements

Ensure these API endpoints exist:

```typescript
// Art Items
DELETE /api/art_catalog/:id          // Delete single art item
GET    /api/art_catalog              // Get full catalog

// Blocks
DELETE /api/blocks/:id               // ✅ Already exists
GET    /api/blocks/collection        // ✅ Already exists
POST   /api/blocks                   // ✅ Already exists
PUT    /api/blocks/:id               // ✅ Already exists

// Streams
DELETE /api/admin/streams/:id        // ✅ Already exists
GET    /api/admin/streams/:id        // ✅ Already exists
GET    /api/admin/streams            // ✅ Already exists (list)
PUT    /api/admin/streams/:id        // ✅ Already exists
POST   /api/admin/streams            // ✅ Already exists
```

## 🎯 Next Steps

1. **Update EditorWorkspace** - Add streamsIndex and refresh methods
2. **Add Delete Art API** - Implement backend endpoint for deleting art items
3. **Integrate Catalog Editor** - Replace deletion with dependency-aware version
4. **Integrate Block Editor** - Replace deletion with dependency-aware version
5. **Handle Return Effects** - Add `dependencyResolved` handling in bootstraps
6. **Test All Scenarios** - Go through testing checklist
7. **Consider Edge Cases:**
   - What if user cancels during manual resolution?
   - What if cascade delete fails partway through?
   - What if dependencies change while dialog is open?

## 🚀 Future Enhancements

- **Undo Support** - Transaction log and rollback
- **Dry Run** - Preview what will be deleted before confirming
- **Visual Graph** - Show dependency tree visually
- **Partial Cascade** - Choose which dependents to delete
- **Background Jobs** - For large cascade operations
- **Dependency Locking** - Prevent modifications during resolution

## 📚 Documentation

All usage documentation is in:
`apps/frontend/src/shared/lib/dependencies/README.md`
