# Dependency-Aware Deletion System

A comprehensive system for safely deleting objects with dependency tracking, journey integration, and cascade deletion support.

## Overview

This system handles three types of objects with dependencies:
- **ArtItem** → used in **Blocks** → used in **Streams**
- **Block** → used in **Streams**
- **Stream** → leaf node (no dependents)

## Features

### 1. **Journey Guard**
Prevents deletion while user is in the middle of editing another object via journey.

### 2. **Dependency Analysis**
Automatically finds all objects that depend on the target deletion.

### 3. **Two Resolution Modes**

#### Manual Resolution
- Shows list of dependent objects
- User clicks on each to navigate (via journey) and manually fix
- Returns to deletion dialog after fixing

#### Cascade Resolution
- Automatically deletes all dependent objects
- Removes blocks from streams
- Deletes streams that become empty
- One-click solution for aggressive cleanup

## Usage

### For Art Items (Catalog Editor)

```typescript
import { useDependencyAwareDeletion } from '@/features/admin/catalogEditor/hooks/useDependencyAwareDeletion';

function CatalogEditor() {
  const { deleteArtItem } = useDependencyAwareDeletion();

  const handleDelete = () => {
    deleteArtItem(artItem);
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### For Blocks (Block Editor)

```typescript
import { useDependencyAwareBlockDeletion } from '@/features/admin/blocks/hooks/useDependencyAwareBlockDeletion';

function BlockEditor() {
  const { deleteBlock } = useDependencyAwareBlockDeletion();

  const handleDelete = () => {
    deleteBlock(block);
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### For Streams (Stream Editor)

Streams are leaf nodes with no dependents, so they use simple deletion:

```typescript
const deleteStream = async () => {
  // Check journey guard
  const guardResult = canStartDeletion();
  if (!guardResult.allowed) {
    alert(guardResult.reason);
    return;
  }

  // Simple deletion - no dependencies to check
  destructiveActionsStore.open({
    title: 'Delete Stream',
    message: 'Permanently delete this stream?',
    run: async () => {
      await streamsApi.remove(streamId);
    },
    onSuccess: () => {
      refreshStreams();
    }
  });
};
```

## Flow Diagrams

### Art Item Deletion Flow

```
User clicks "Delete ArtItem"
         ↓
Journey Guard Check ───→ Blocked if journey active
         ↓
Analyze Dependencies
         ↓
    ┌────┴────┐
    │         │
No Deps    Has Deps
    │         │
    │    Show Dialog:
    │    • List of dependent blocks/streams
    │    • Manual resolution buttons
    │    • Cascade delete option
    │         │
Simple    ┌──┴──┐
Delete    │     │
    │  Manual Cascade
    │     │     │
Confirm   │     └─→ Delete all
    │     │           • Blocks
Delete    │           • Update/delete streams
         └─→ Journey to dependent
                ↓
            User fixes dependency
                ↓
            Returns via journey
                ↓
            Re-check dependencies
                ↓
            (repeat if still has deps)
```

### Block Deletion Flow

```
User clicks "Delete Block"
         ↓
Journey Guard Check
         ↓
Analyze Dependencies (check streams)
         ↓
    ┌────┴────┐
    │         │
No Deps    Has Deps
    │         │
Simple    Show Dialog
Delete    (manual or cascade)
```

## Architecture

### Core Components

1. **`dependency.types.ts`** - TypeScript types for dependency graph
2. **`dependencyResolver.ts`** - Service that analyzes dependencies
3. **`destructiveActions.store.ts`** - Global store for deletion state
4. **`DestructiveOverlay.tsx`** - UI component showing dependencies
5. **`useJourneyGuard.ts`** - Hook to prevent deletion during journey
6. **`useDependencyAwareDeletion.ts`** - Hook for art item deletion
7. **`useDependencyAwareBlockDeletion.ts`** - Hook for block deletion

### Integration Points

Must be integrated with:
- **EditorWorkspace** context (provides blocks/streams/catalog data)
- **Journey system** (for navigation to dependents)
- **API layer** (for actual deletion operations)

## API Requirements

Your backend must support:

```typescript
// Delete art item
DELETE /api/art_catalog/{id}

// Delete block
DELETE /api/blocks/{id}

// Delete stream
DELETE /api/streams/{id}

// Update stream (for removing blocks)
PUT /api/streams/{id}

// Get stream (for checking dependencies)
GET /api/streams/{id}
```

## Future Enhancements

### Accurate Empty Stream Detection
Currently estimates which streams would become empty. Could enhance by loading streams during cascade preview calculation.

### Undo Support
Could add transaction log and undo capability for cascade deletions.

### Dry Run Mode
Show exactly what would be deleted before actually doing it.

### Dependency Graph Visualization
Visual tree/graph showing dependency relationships.

### Partial Cascade
Let user choose which dependents to cascade delete and which to keep.

## Testing Checklist

- [ ] Delete art item with no dependencies
- [ ] Delete art item used in one block
- [ ] Delete art item used in multiple blocks
- [ ] Navigate to dependent block manually
- [ ] Cascade delete art item
- [ ] Delete block with no streams
- [ ] Delete block used in one stream
- [ ] Delete block used in multiple streams
- [ ] Cascade delete block
- [ ] Try to delete while journey is active (should block)
- [ ] Verify empty streams are deleted
- [ ] Verify streams with remaining blocks are updated only

## Troubleshooting

### "Cannot delete during journey"
You're in the middle of editing another object. Save or cancel that work first.

### Dependencies not showing
Check that `EditorWorkspace` context has loaded:
- `currentBlocksCollection`
- `streamsIndex`

### Cascade delete fails partway
Check backend logs. The operation tries to continue on error but some objects may be partially deleted.

### Journey navigation doesn't work
Verify `returnEffect` kind is handled in target editor's bootstrap logic.
