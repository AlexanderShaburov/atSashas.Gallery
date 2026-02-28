# Dependency-Aware Deletion - Testing Checklist

## ✅ Setup Complete

- [x] Frontend types defined
- [x] Dependency resolver service created
- [x] DestructiveOverlay UI enhanced
- [x] EditorWorkspace context updated (streams index + refresh methods)
- [x] Catalog editor integration complete
- [x] Journey types expanded (dependencyResolved)
- [x] Backend endpoint exists (`DELETE /art/catalog/:id`)
- [x] API URL fixed to match backend

## 🧪 Now Test These Scenarios

### **Scenario 1: Delete Art Item - No Dependencies** ✨
**Expected:** Simple confirmation dialog

1. Open Catalog Editor
2. Select an art item that is NOT used in any blocks
3. Click "Delete" button
4. **Expected Result:**
   - ✅ Dialog shows: "Delete [name]? No dependencies found."
   - ✅ Only "Cancel" and "Delete" buttons (no dependency list)
5. Click "Delete"
6. **Expected Result:**
   - ✅ Art item is deleted
   - ✅ Catalog refreshes
   - ✅ Item disappears from grid

### **Scenario 2: Delete Art Item - Has Dependencies** ✨
**Expected:** Shows dependency overlay with manual/cascade options

1. Create a gallery block with 1-2 art items
2. Try to delete one of those art items
3. **Expected Result:**
   - ✅ Dialog shows: "This art item is used in X places"
   - ✅ Dependency list appears with:
     - 🧱 Block name (e.g., "Gallery 2023" - position 2)
     - Each has a clickable button with "→"
   - ✅ Shows cascade delete section:
     - "⚠️ Cascade Delete will remove: X blocks"
     - "Delete All (Cascade)" button

### **Scenario 3: Manual Dependency Resolution** 🔄
**Expected:** Navigate to block editor, fix, return, re-check

1. Start deleting an art item that has dependencies
2. Click on one of the dependent blocks (→ button)
3. **Expected Result:**
   - ✅ Overlay closes
   - ✅ Navigates to Block Editor
   - ✅ Block opens in edit mode
4. Remove the art item from the block
5. Click "Save" or "Apply"
6. **Expected Result:**
   - ✅ Journey returns to Catalog Editor
   - ✅ Dependency overlay re-appears automatically
   - ✅ List shows updated dependencies (one less)
7. Repeat until no dependencies remain
8. **Expected Result:**
   - ✅ Shows simple delete confirmation
   - ✅ Can delete successfully

### **Scenario 4: Cascade Delete** 💥
**Expected:** Deletes art item + all dependent blocks + updates/deletes streams

1. Create setup:
   - Art item "Sunset.jpg"
   - Block A uses "Sunset.jpg"
   - Block B uses "Sunset.jpg"
   - Stream X contains Block A
   - Stream Y contains Block A and Block B
2. Try to delete "Sunset.jpg"
3. Click "Delete All (Cascade)"
4. **Expected Result:**
   - ✅ Art item deleted
   - ✅ Block A deleted
   - ✅ Block B deleted
   - ✅ Stream X either updated (blocks removed) or deleted (if empty)
   - ✅ Stream Y either updated (blocks removed) or deleted (if empty)
   - ✅ All three contexts refresh (catalog, blocks, streams)

### **Scenario 5: Journey Guard** 🚫
**Expected:** Blocks deletion during active journey

1. Start editing a block (creates journey)
2. Navigate to Catalog Editor
3. Try to delete an art item
4. **Expected Result:**
   - ✅ Alert: "Cannot start deletion while in journey mode"
   - ✅ Overlay does NOT open
5. Complete journey (save or cancel)
6. Try delete again
7. **Expected Result:**
   - ✅ Now works normally

### **Scenario 6: Block Deletion with Stream Dependencies** 🧱
**Expected:** Similar flow but for blocks

1. Create a stream with several blocks
2. Try to delete one of those blocks
3. **Expected Result:**
   - ✅ Shows dependency overlay with streams listed
   - ✅ Can navigate to stream (manual resolution)
   - ✅ Can cascade delete (removes from streams)

## 🔍 Things to Watch For

### Console Logs
Look for these messages:
```
[useDependencyAwareDeletion]: Attempting to delete art item X
[useDependencyAwareDeletion]: Dependency tree: { ... }
[Catalog BOOTSTRAP]: Dependency resolution return detected
[useDependencyAwareDeletion]: Cascade delete completed
```

### Network Tab
Check these API calls:
```
DELETE /api/art/catalog/:id          → Delete art item
GET    /api/blocks/collection        → Get blocks (for dependency check)
GET    /api/admin/streams            → Get streams (for dependency check)
GET    /api/admin/streams/:id        → Load stream details
PUT    /api/admin/streams/:id        → Update stream (remove blocks)
DELETE /api/admin/streams/:id        → Delete empty stream
DELETE /api/blocks/:id               → Delete block (cascade)
```

### Potential Issues

1. **"Cannot read properties of null"**
   - Check `EditorWorkspace` has loaded:
     - `currentBlocksCollection`
     - `streamsIndex`
     - `currentArtCatalog`

2. **Dependency overlay doesn't show**
   - Check console for errors
   - Verify `destructiveActionsStore.open()` is called
   - Check phase transitions

3. **Journey doesn't return properly**
   - Check return effect kind matches: `'dependencyResolved'`
   - Verify bootstrap handles the return
   - Check `journeySessionStore` state

4. **Cascade delete fails partway**
   - Check backend logs
   - May need to refresh to see partial state
   - Consider adding transaction/rollback (future)

5. **Empty streams not deleted**
   - Check cascade logic in `useDependencyAwareDeletion.ts` line 134
   - Verify `streamsApi.remove()` is called

## 🎯 Success Criteria

The integration is successful when:

- ✅ Simple deletion works (no deps)
- ✅ Dependency overlay appears correctly
- ✅ Manual navigation works (journey to/from block/stream)
- ✅ Cascade delete removes everything in correct order
- ✅ Journey guard prevents deletion during active journey
- ✅ All refresh methods work (catalog/blocks/streams)
- ✅ No console errors or warnings
- ✅ Backend endpoints respond correctly

## 🐛 If Something Breaks

1. **Check browser console** - Look for errors
2. **Check network tab** - Which API call failed?
3. **Check backend logs** - Any Python errors?
4. **Check React DevTools** - Inspect component state
5. **Add more logs** - In hooks/bootstrap/overlay

## 📝 Known Limitations

1. **No undo** - Deletions are permanent (consider adding transaction log)
2. **No optimistic updates** - UI refreshes after backend confirms
3. **No partial cascade** - All or nothing (could add granular selection)
4. **Empty stream detection** - Calculated, not always accurate (could improve)

---

**Ready to test!** Start with Scenario 1 (simple delete) and work your way up. 🚀
