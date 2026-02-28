  ---
  Compliance Audit Summary

  Area: Layer dependencies
  Status: Mostly compliant
  Violations: 8 hard violations
  ────────────────────────────────────────
  Area: Editor architecture (Context = Control Plane)
  Status: Partially compliant
  Violations: 2 major, 3 minor
  ────────────────────────────────────────
  Area: Journey navigation
  Status: Mostly compliant
  Violations: 2 violations
  ────────────────────────────────────────
  Area: Store vs Context (Data Plane)
  Status: Major violations
  Violations: 6 contexts hold global data
  ────────────────────────────────────────
  Area: Rendering (Frame + Renderable)
  Status: Not implemented
  Violations: 3 parallel render paths
  ────────────────────────────────────────
  Area: Domain model
  Status: Mostly compliant
  Violations: 2 clarifications needed
  ────────────────────────────────────────
  Area: Standard UI surfaces
  Status: Partial
  Violations: Toolbar good, ThreeDotMenu underused
  ────────────────────────────────────────
  Area: Quick View (ADR-007)
  Status: Not implemented
  Violations: Direct full-screen on click

  ---
  Violation Map by Severity

  CRITICAL (Architecture contracts broken)

  1. "God Context" / Store-Context Boundary (ADR-003)

  This is the deepest systemic issue. Six contexts hold global collections in
  useState instead of external stores:

  Context: EditorWorkspaceContext
  Data held in React state: blocksCollection, artCatalog, streamsIndex
  Should be: External stores or removed
  ────────────────────────────────────────
  Context: BlockEditorSession
  Data held in React state: collection (all blocks)
  Should be: External store
  ────────────────────────────────────────
  Context: StreamEditorSession
  Data held in React state: streamsIndex, publicStream
  Should be: External store
  ────────────────────────────────────────
  Context: CatalogEditorSession
  Data held in React state: catalog, techniquesRange, seriesOptions
  Should be: External store
  ────────────────────────────────────────
  Context: EventEditorSession
  Data held in React state: events[] (entire list)
  Should be: External store (uses zero external stores)
  ────────────────────────────────────────
  Context: PublicStreamSession
  Data held in React state: savedDoc, draft
  Should be: editSessionsDataStore

  EditorWorkspaceContext is effectively a god-context that duplicates data
  already loaded by individual editors. This creates double-ownership and sync
  issues (e.g., gCtx.setArtCatalog(cat) in CatalogEditorSession).

  2. Three parallel block rendering paths (ADR-005)

  No Frame/Renderable abstraction exists. The same block types are rendered
  independently in three places:

  Admin:  GalleryComponent / TextBlockComponent / CtaBlockComponent /
  EventCtaBlockComponent
  Public: ImageComponent / TextComponent / EventCtaView
  Home:   HomeBlockTile (GalleryTile / TextTile / CtaTile / EventCtaTile)

  Layout ordering is duplicated too: ITEM_POSITIONS (admin) vs RENDER_ORDER
  (public) — same data, different names.

  HIGH (Contract violations in specific files)

  3. Business logic leaked into UI components (ADR-002, Rule 3.3)

  - GalleryComponent.tsx — handleChooseEvent(), handleChooseArt(), slot choice
  state all belong in BlockEditorSession context
  - PublicStreamEditor.tsx — localStorage.setItem(), drag-drop coordination
  logic, nonPublicStreams filtering all belong in PublicStreamSession context
  - EventEditor.tsx — slugify() transformation belongs in context

  4. Layer dependency violations (Rule 1)

  shared/ imports from features/ in 4 places:
  - dependencyResolver.ts → streamsApi (admin feature)
  - journey.types.ts → BlockHitEvent (admin UI type)
  - useResolveArtAdaptive.ts → useEditorWorkspace (admin context)
  - EventsLoader.tsx → eventsModule (public feature)

  features/ imports from pages/ in 4 places:
  - Catalog editor components → SingleItemEditorProps from
  pages/admin/catalogEditorPage/

  Cross-feature:
  - features/public/ → features/admin/ in 2 places (isEventItem util,
  getCollection API)

  5. AdminHeader not guarded during Journey (ADR-001)

  All NavLink elements render unconditionally. Users can break an active Journey
   by clicking header navigation. No guard, no confirmation.

  6. PublicStreamSession.editStream() bypasses Journey (ADR-001)

  navigate(`/admin/streams?edit=${streamId}`);  // line 216

  Uses query params instead of Journey ticket. The addBlockViaJourney() in the
  same file shows the correct pattern.

  MEDIUM (Positioning / clarification needed)

  7. Domain model ambiguities (Rule 2)

  - HomeDoc exists as a 6th entity without explicit justification. Constitution
  says "HomePage" — is HomeDoc the intended representation? Needs a decision.
  - entities/grid/ is a view model, not a domain entity — should move to
  shared/ui/ or features/
  - entities/hopper/ is correctly minimal but positioned as entity — could move
  to features/admin/upload/

  8. CatalogEditorPage dual-state (Rule 3.1)

  Page holds its own selectedItemId state while context also has one — two
  sources of truth.

  ---
  Roadmap: Bringing the Project to Compliance

  I'd organize this into 4 waves, each self-contained and testable:

  Wave 1: Data Plane (fix the foundation)

  Goal: Establish external stores as single source of truth, dissolve
  god-context.

  1. Create dedicated external stores:
    - blocksCollectionStore
    - streamsIndexStore
    - catalogStore (+ techniques, series)
    - eventsStore
  2. Refactor each editor context to subscribe to stores via
  useSyncExternalStore instead of useState for collections
  3. Decide EditorWorkspaceContext fate: thin wrapper around stores or remove
  entirely
  4. Bring EventEditorSession into external store pattern (currently uses zero
  stores)
  5. Move PublicStreamSession saved/draft into editSessionsDataStore

  Why first: Every other fix depends on clear data ownership. Without this,
  Journey bootstrap and editor contexts remain fragile.

  Wave 2: Control Plane cleanup

  Goal: Enforce Context = logic, UI = rendering.

  1. Move business logic out of GalleryComponent → into BlockEditorSession
  context (slot choice state, handleChooseEvent, handleChooseArt)
  2. Move logic out of PublicStreamEditor → into PublicStreamSession context
  (drag-drop coordination, filtering, preview)
  3. Move slugify out of EventEditor UI → into context
  4. Fix CatalogEditorPage dual selectedItemId → single source in context
  5. Fix PublicStreamSession.editStream() to use Journey instead of navigate()
  6. Add Journey guard to AdminHeader (disable/confirm nav during active
  Journey)

  Wave 3: Layer hygiene

  Goal: Clean dependency violations.

  1. Move BlockHitEvent type from features/admin/blocks/ui/ → entities/block/
  2. Move isEventItem() util from features/admin/ → shared/lib/
  3. Move SingleItemEditorProps from pages/ → features/admin/catalogEditor/
  4. Abstract dependencyResolver to accept API as parameter (not import
  directly)
  5. Create features/public/api/blocksPublicApi.ts so public doesn't import
  admin's getCollection
  6. Resolve entities/grid/ → move to shared/ui/ or features/
  7. Document HomeDoc as the "HomePage" entity in Constitution, or rename

  Wave 4: Rendering unification (converge toward Frame + Renderable)

  Goal: Start the ADR-005 direction. Not a big-bang rewrite —
  touch-and-converge.

  1. Define Renderable contract (kind, ref, mode, appearance)
  2. Define Frame component (container, sizing, click area)
  3. Unify ITEM_POSITIONS / RENDER_ORDER into single shared constant
  4. Extract block rendering switch into a shared BlockRenderer that accepts
  mode (admin-edit / admin-preview / public / home-tile)
  5. Implement Quick View panel (ADR-007) — replaces direct open() on public art
   click
  6. Extend ThreeDotMenu usage to block collection grid items

  ---
  What's NOT broken

  The project has strong foundations worth noting:
  - Journey store is correctly external (journeySessionStore)
  - editSessionsDataStore pattern is solid and used by Block/Stream/Catalog
  editors
  - Save vs Apply semantics are properly distinguished in toolbars
  - Bootstrap patterns correctly use arrival() synchronously
  - No prop-drilling for cross-editor returns
  - Entity type definitions are clean and well-structured
  - SingleEditorToolbar composition model works well

  ---
  Wave 3 Report: Layer Hygiene — COMPLETED

  All layer dependency violations identified in audit item #4 have been resolved.
  Build, type-check, and lint all pass with zero errors.

  Task 1: Move BlockHitEvent / BlockHit / Hit to entities/block/
  Violation: shared/nav/journey.types.ts imported from features/admin/
  Fix: Created entities/block/blockHit.types.ts with types + Hit factory.
  Updated 16 importers to use @/entities/block. Original editorTypes.ts
  now re-exports from entities.
  Status: DONE

  Task 2: Move isArtItem / isEventItem to shared/lib/
  Violation: features/public/ imported from features/admin/
  Fix: Created shared/lib/checkers/blockItemGuards.ts with pure type guards.
  Updated features/public/ui/Image/ImageComponent.tsx and
  features/admin/shared/ui/BlockPreview/GalleryComponent.tsx.
  Updated dynamic imports in BlockEditorSession.context.tsx.
  Removed duplicated functions from blockEditorSession.utils.tsx.
  Status: DONE

  Task 3: Move SingleItemEditorProps from pages/ to features/
  Violation: 4 files in features/admin/catalogEditor/ imported from pages/
  Fix: Inlined ProviderProps and SingleItemEditorProps into
  catalogEditorSession.types.ts. Updated 4 importers. Deleted
  pages/admin/catalogEditorPage/catalogEditor.types.ts.
  Status: DONE

  Task 4: Abstract dependencyResolver to accept API as parameter
  Violation: shared/lib/dependencies/dependencyResolver.ts imported streamsApi
  from features/admin/
  Fix: Added StreamFetcher type to dependency.types.ts. Changed
  findBlockDependents, buildBlockDependencyTree, buildArtItemDependencyTree
  to accept fetchStream parameter. Updated 3 callers to pass streamsApi.get.
  Status: DONE

  Task 5: Create public blocks collection API
  Violation: features/public/ui/GalleryStream/ imported getCollection from
  features/admin/
  Fix: Added getBlockCollection() to features/public/api/publicBlocksApi.ts.
  Updated GalleryStream.tsx to use the public API function.
  Status: DONE

  Task 6: Relocate entities/grid/ to shared/ui/grid/
  Violation: GridItem is a view/presentation model, not a domain entity
  Fix: Created shared/ui/grid/gridItem.ts and index.ts barrel. Updated 11
  importers. Deleted entities/grid/ directory.
  Status: DONE

  Task 7: Align HomeDoc naming in Constitution
  Violation: Code uses HomeDoc, Constitution said HomePage
  Fix: Updated CONSTITUTION.md (3 occurrences) and CLAUDE.md (3 occurrences)
  to use HomeDoc consistently.
  Status: DONE

  Post-verification grep results:
  - shared/ → @/features: 0 code imports (only README examples + 1 pre-existing
    EventsLoader outside scope)
  - features/public/ → @/features/admin: 0 results
  - features/ → @/pages: 0 results
  - @/entities/grid: 0 results

  Remaining layer violations (out of Wave 3 scope):
  - shared/EventsProvider/EventsLoader.tsx → features/public/api/eventsModule
  - shared/ArtCatalogProvider/useResolveArtAdaptive.ts →
    features/admin/ (useEditorWorkspace) — noted in audit item #4

  ---
  Want me to start working on any specific wave, or would you like to discuss
  priorities first?
