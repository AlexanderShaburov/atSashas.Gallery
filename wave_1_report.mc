Wave 1: Data Plane — External Stores as Single Source of Truth is complete.

  What was done (all 12 steps):

  1. DataStore<T> generic class created (shared/state/DataStore.ts)
  2. useStoreData<T> hook created (shared/state/useStoreData.ts)
  3. 4 domain stores created: blocksCollectionStore, streamsIndexStore,
  catalogStore, eventsStore
  4. Refresh functions added to all 4 API modules
  5. EditorWorkspaceProvider replaced with thin AdminDataPreloader (no context,
  no state)
  6. BlockEditorSession migrated — removed gCtx, reads from stores
  7. StreamEditorSession migrated — removed gCtx, reads from stores
  8. CatalogEditorSession migrated — removed gCtx, reads from stores
  9. 3 dependency-aware deletion hooks migrated to use stores directly
  10. Remaining consumers migrated (SingleStreamEditor, useResolveArtAdaptive,
  PublicStreamSession, PublicStreamEditor)
  11. EditorWorkspaceContext fully eliminated (no remaining imports)
  12. EditorKey extended with home and events variants

  Verification results:

  - Vite build: passes (2.94s)
  - ESLint: zero warnings on all modified files
  - TypeScript: only pre-existing errors remain (9 errors that existed before
  the migration)

  What remains (manual, not code changes):

  - Smoke test all admin editors (Blocks, Streams, Catalog, Events, Home
  Composer)
  - Test journey flows (Stream → Block → Catalog round-trip)
  - Test dependency-aware deletion
  - Verify public pages resolve art items correctly

  No further code changes are needed unless you'd like to proceed with something
   else.
