# MAP.md — Architecture Map

## Monorepo Layout

```
apps/frontend/        React 19 + Vite + TypeScript
apps/admin-backend/   FastAPI + Poetry (JSON storage)
docker/               Docker Compose + Caddy proxy
vault/                JSON catalogs + media assets
```

---

## Frontend Modules

### app/ — Entry Point & Shell

| File | Responsibility |
|---|---|
| `app/main.tsx` | Mount React → `AppProviders` → `RouterProvider` |
| `app/router.tsx` | All routes, lazy imports, provider wrappers |
| `app/providers/AppProviders.tsx` | Compose `ThemeProvider` + `AuthProvider` |
| `app/layouts/PublicLayout.tsx` | Header + `CatalogProvider` + Outlet + Footer |
| `app/layouts/AdminLayout.tsx` | AdminHeader + DestructiveOverlay + Outlet |
| `app/guards/RequireAuth.tsx` | Redirect to `/admin/login` if unauthenticated |

**Routes:**

| Path | Page | Wrappers |
|---|---|---|
| `/` | `HomePage` | ArtCatalogLoader → EventsLoader → PublicLayout |
| `/gallery/:slug` | `GalleryPage` | same |
| `/about` | `AboutPage` | same |
| `/admin` | `AdminIndexPage` | RequireAuth → ArtCatalogLoader → EventsLoader → EditorWorkspaceProvider → AdminLayout |
| `/admin/blocks` | `BlocksPage` | + `BlockEditorSessionProvider` |
| `/admin/streams` | `StreamsPage` | + `StreamEditorSessionProvider` |
| `/admin/catalog` | `CatalogEditorPage` | + `CatalogEditorSessionProvider` |
| `/admin/events` | `EventsPage` | + `EventEditorSessionProvider` |
| `/admin/upload` | `UploadPage` | — |
| `/admin/public-stream` | `PublicStreamPage` | — |

---

### entities/ — Domain Models (no UI, no logic)

| Module | Key Types | Files |
|---|---|---|
| `entities/art/` | `ArtItem` (class), `ArtItemData`, `ImagesJSON` | `ArtItem.ts`, `artUnit.ts`, `images.ts` |
| `entities/block/` | `GalleryBlock`, `TextBlock`, `CtaBlock`, `EventCtaBlock`, `BlockKind`, `GalleryLayout`, `LAYOUT_SCHEME` | `block.types.ts`, `blockHit.types.ts` |
| `entities/stream/` | `StreamData`, `StreamStatus`, `StreamsIndex` | `stream.types.ts`, `streamApi.types.ts` |
| `entities/event/` | `EventData`, `EventStatus`, `Enrollment` | `event.types.ts`, `event-catalog.types.ts` |
| `entities/homeDoc/` | `HomeDoc`, `HomeItem` (streamRef \| blockRef) | `homeDoc.types.ts` |
| `entities/catalog/` | `ArtCatalog` | `catalog.ts` |
| `entities/hopper/` | `HopperItem` | `hopperItem.ts` |
| `entities/common/` | `Localized`, `Money`, `Dimensions`, `EntityLifecycle`, `EditorMode` | `locales.ts`, `money.ts`, `dimensions.ts`, `lifecycle.ts` |

---

### features/admin/ — Admin Business Logic

#### Editor Sessions (one per domain, identical pattern)

| Editor | Context Provider | Bootstrap | API |
|---|---|---|---|
| **Blocks** | `blocks/blockEditorSession/BlockEditorSession.context.tsx` | `bootstrap/blockEditorSession.bootstrap.resolver.ts` | `api/blocksApi.ts` |
| **Streams** | `streams/streamEditorSession/StreamEditorSession.context.tsx` | `bootstrap/streamEditorSession.bootstrap.resolve.ts` | `api/streamsApi.ts` |
| **Catalog** | `catalogEditor/catalogEditorSession/CatalogEditorSession.context.tsx` | `editorLogic/catalogLogic.ts` | `api/index.ts` |
| **Events** | `eventEditor/eventEditorSession/EventEditorSession.context.tsx` | — | `api/eventsAdminApi.ts` |
| **PublicStream** | `publicStream/publicStreamSession/PublicStreamSession.context.tsx` | — | `api/publicStreamApi.ts`, `api/homeDocAdminApi.ts` |

Each context provider: CRUD, mode stack, journey integration, validation, toolbar commands.

#### Shared Admin

| Module | Responsibility | Key File |
|---|---|---|
| Transporter | Journey hooks: `useDispatch`, `useReturnHome`, `useArrival`, `usePeekTicket`, `useJourneyStatus` | `shared/transporter/transporter.ts` |
| BlockPreview | Admin block renderers: `BlockRenderer`, `GalleryComponent`, `TextBlockComponent`, `SlotChoiceMenu` | `shared/ui/BlockPreview/` |
| ArtItemGrid | Grid for catalog selection | `shared/ui/ArtItemGrid/ArtItemGrid.tsx` |
| AdminHeader | Navigation header + `GuardedNavLink` (journey-aware) | `shared/ui/adminHeader/AdminHeader.tsx` |
| DestructiveOverlay | Delete confirmation UI | `shared/ui/DestructiveOverlay/DestructiveOverlay.tsx` |
| JourneyGuard | Block destructive actions during journey | `shared/hooks/useJourneyGuard.ts` |

---

### features/public/ — Public Rendering

| Component | Responsibility | File |
|---|---|---|
| `GalleryBlock` | Render gallery block (dispatches by layout) | `ui/GalleryBlock/GalleryBlock.tsx` |
| `GalleryStream` | Render stream as vertical block sequence | `ui/GalleryStream/GalleryStream.tsx` |
| `ImageComponent` | Render art item in gallery slot | `ui/Image/ImageComponent.tsx` |
| `GallerySlotEventView` | Render event in gallery slot | `ui/Image/GallerySlotEventView.tsx` |
| `TextComponent` | Render text block | `ui/Text/TextComponent.tsx` |
| `CtaView` | Render CTA block | `ui/Cta/CtaView.tsx` |
| `EventCtaView` + `EnrollmentForm` | Event CTA + enrollment | `ui/EventCta/` |

**Hooks & API:**

| Hook | Purpose | File |
|---|---|---|
| `useGallery` | Load stream + blocks by slug | `hooks/useGallery.ts` |
| `useHomeFeed` | Load HomeDoc + resolve blocks | `hooks/useHomeFeed.ts` |
| `usePublicStream` | Load public streams list | `hooks/usePublicStream.ts` |

---

### features/auth/

| File | Responsibility |
|---|---|
| `authContext.tsx` | `AuthProvider`, `useAuth()` — login/logout/session state |
| `authApi.ts` | POST `/auth/login`, `/auth/logout`, GET `/auth/me` |

---

### shared/ — Universal Layer

#### Navigation (Journey System)

| File | Responsibility |
|---|---|
| `nav/journeySession.store.ts` | External store: `pushOutbound`, `completeReturn`, `continueJourney`, `clear` |
| `nav/journey.types.ts` | `JourneyTicket`, `ReturnCommand` (11 variants), `JumpResult` |
| `nav/journeySession.types.ts` | `JourneySession`, `SessionLeg`, `NextAction` |
| `nav/editorKey.types.ts` | `EditorKind` = stream \| block \| catalog \| hopper \| events \| home |

#### State (External Stores)

| Store | Data | File |
|---|---|---|
| `catalogStore` | Art catalog | `state/domain/catalog.store.ts` |
| `blocksCollectionStore` | All blocks | `state/domain/blocksCollection.store.ts` |
| `streamsIndexStore` | Streams index | `state/domain/streamsIndex.store.ts` |
| `eventsStore` | Events catalog | `state/domain/events.store.ts` |
| `editSessionsDataStore` | Draft/snapshot per editor | `state/editorSessionsData.store.ts` |
| `unsavedChangesStore` | Dirty flags | `state/unsavedChanges.store.ts` |
| `destructiveActionsStore` | Pending deletes | `state/destructiveActions.store.ts` |

Hook: `useStoreData(store)` — connects via `useSyncExternalStore`.

#### UI Components

| Component | Purpose | File |
|---|---|---|
| `SingleEditorToolbar` | Primary actions (Save, Apply, Delete) | `ui/SingleEditorToolbar/SingleEditorToolbar.tsx` |
| `ThreeDotMenu` | Secondary actions | `ui/ThreeDotMenu/ThreeDotMenuOverlay.tsx` |
| `ArtPicture` | Responsive art image | `ui/ArtPicture/ArtPicture.tsx` |
| `QuickView` | Metadata panel (ADR-007) | `ui/QuickView/QuickView.tsx` |
| `Frame` | Unified layout container (ADR-004) | `ui/Frame/Frame.tsx` |
| `Lightbox` | Modal lightbox | `ui/lightbox/Lightbox.tsx` |

#### Lib

| Module | Key Exports | File |
|---|---|---|
| checkers | `isArtItem`, `isEventItem`, `deepEqual` | `lib/checkers/` |
| dependencies | `dependencyResolver` | `lib/dependencies/dependencyResolver.ts` |
| id | `generateId` | `lib/id/generateId.ts` |
| text | `slugify` | `lib/text/slugify.ts` |
| resolvers | Art item lookup | `lib/resolvers/resolvers.ts` |

#### Providers

| Provider | Scope | File |
|---|---|---|
| `ArtCatalogLoader` | Fetch catalog → block rendering until loaded | `ArtCatalogProvider/ArtCatalogLoader.tsx` |
| `ArtCatalogProvider` | Catalog context for pages | `ArtCatalogProvider/ArtCatalogProvider.tsx` |
| `EventsLoader` | Fetch events (non-blocking) | `EventsProvider/EventsLoader.tsx` |

---

### pages/ — Route Leaf Components

**Public:** `HomePage.tsx`, `GalleryPage.tsx`, `AboutPage.tsx`, `EnrollmentSuccessPage.tsx`, `EnrollmentCancelPage.tsx`
**Admin:** `AdminIndexPage.tsx`, `LoginPage.tsx`, `BlocksPage/BlocksPage.tsx`, `StreamPage/StreamsPage.tsx`, `catalogEditorPage/CatalogEditorPage.tsx`, `EventsPage.tsx`, `UploadPage.tsx`, `PublicStreamPage.tsx`

---

## Backend Modules

### Entry Point

| File | Responsibility |
|---|---|
| `app/main.py` | FastAPI app, CORS, static files, 13 routers |
| `app/settings.py` | Pydantic BaseSettings (paths, auth, Stripe) |
| `app/storage.py` | Generic `read_json`/`write_json` |

### API Routes (`app/routers/`)

| Router | Endpoints | Auth |
|---|---|---|
| `health.py` | `GET /health` | No |
| `auth/auth.py` | `POST /auth/login`, `/auth/logout`, `GET /auth/me` | No / Cookie |
| `json_kv.py` | `GET/PUT /json/{key}` | PUT: Yes |
| `art/catalog.py` | `POST /art/catalog/update`, `GET /art/dependencies/{id}`, `DELETE /art/catalog/{id}` | Yes |
| `block/blocks.py` | `GET /blocks/collection`, `POST/PUT/DELETE /blocks/{id}` | Yes |
| `block/public_blocks.py` | `GET /public/blocks?stream_id=`, `GET /public/blocks/by-ids?ids=` | No |
| `hopper/upload.py` | `POST /upload`, `GET /upload/by-name/{name}` | Yes |
| `hopper/hopper.py` | `GET /hopper/content`, `DELETE /hopper/{id}` | Yes |
| `streams/streams.py` | `GET/POST/PUT/DELETE /admin/streams/*`, `GET /public/streams/*` | Admin: Yes |
| `public_stream/public_stream.py` | `GET/POST /admin/public_stream/*`, `GET /public/public_stream` | Admin: Yes |
| `events/events.py` | `GET/POST/PUT/DELETE /admin/events/*`, `GET /public/events/*` | Admin: Yes |
| `enrollments/enrollments.py` | `POST /public/events/{id}/enroll`, Stripe webhook | No |
| `home_doc/home_doc.py` | `GET/PUT /admin/home`, `GET /public/home` | Admin: Yes |

### Repositories (`app/repos/`)

| Repo | Storage File | Key Feature |
|---|---|---|
| `catalog_repo.py` | `json/art_catalog.json` | Async context manager, versioning |
| `collection_repo.py` | `json/block_collection/block_collection.json` | Read-only + session mode |
| `stream_repo.py` | `json/streams/index.json` + `{id}.json` | Optimistic concurrency (version) |
| `public_stream_repo.py` | `json/public_stream.json` | Version check, reorder |
| `event_repo.py` | `json/events/catalog.json` | ID: `event-YYYYMMDD-random` |
| `home_doc_repo.py` | `json/public/home.json` | Fallback to legacy PublicStream |

### Auth (`app/auth/`)

| File | Responsibility |
|---|---|
| `security.py` | bcrypt + JWT (HS256) |
| `session.py` | In-memory session store, single session per user, inactivity timeout |
| `dependencies.py` | `get_current_user()` — FastAPI dependency, cookie extraction |
| `repository.py` | Load users from `json/users.json` |

### Services (`app/services/`)

| File | Responsibility |
|---|---|
| `catalog_service.py` | Process hopper shipment → ArtItem creation |
| `block_collection_service.py` | Generate block IDs (`block-<kind>-<random>`) |
| `stripe_service.py` | Stripe checkout sessions + webhook verification |

---

## 5 User Scenarios

### Scenario 1: Visitor Opens Home Page

```
1. Browser → GET /
2. router.tsx          → lazy-load HomePage
3. ArtCatalogLoader    → GET /api/json/art_catalog → catalog into store
4. EventsLoader        → GET /public/events → events into store
5. PublicLayout.tsx     → render Header + CatalogProvider + Outlet
6. HomePage.tsx         → calls useHomeFeed()
7. useHomeFeed.ts       → GET /api/public/home → HomeDoc
                        → GET /api/public/blocks/by-ids?ids=... → blocks
                        → GET /api/public/streams/published → streams
8. HomePage.tsx         → iterates HomeDoc.items:
                           streamRef → GalleryStream.tsx → GalleryBlock.tsx → ImageComponent.tsx
                           blockRef  → GalleryBlock.tsx → ImageComponent.tsx
9. ImageComponent.tsx   → renders ArtPicture with responsive sources from catalog
```

**Files:** `app/router.tsx` → `shared/ArtCatalogProvider/ArtCatalogLoader.tsx` → `pages/public/HomePage.tsx` → `features/public/hooks/useHomeFeed.ts` → `features/public/ui/GalleryBlock/GalleryBlock.tsx` → `features/public/ui/Image/ImageComponent.tsx`

---

### Scenario 2: Admin Creates a New Block with Art from Catalog

```
 1. Admin navigates to /admin/blocks
 2. router.tsx                      → BlockEditorSessionProvider wraps BlocksPage
 3. BlockEditorSession.context.tsx  → bootstrap: arrival() → no ticket → resetSession()
                                    → refreshCollection() via blocksApi.ts
 4. BlocksPage.tsx                  → renders CollectionGrid (select mode)
 5. Admin clicks "New Gallery Block" template
 6. BlockEditorSession.context.tsx  → createBlock(template) → POST /api/blocks
                                    → push 'edit' onto mode stack
 7. SingleBlockEditor.tsx           → renders block form + GalleryComponent preview
 8. Admin clicks empty slot in GalleryComponent
 9. SlotChoiceMenu.tsx              → shows "Art" / "Event" options → admin picks "Art"
10. BlockEditorSession.context.tsx  → useDispatch() → creates JourneyTicket:
                                       destination: { editor: 'catalog', mode: 'select' }
                                       returnEffect: { kind: 'blockInsertArt', blockId, pendingSelection }
                                    → journeySessionStore.pushOutbound(ticket)
                                    → navigate('/admin/catalog')
11. CatalogEditorSession.context.tsx → bootstrap: arrival() → gets ticket
                                     → shows catalog in select mode
12. Admin selects art item → useReturnHome()
                           → completeReturn(editor, { ok: true, id: artId })
                           → continueJourney() → { kind: 'navigate', editor: 'block' }
                           → navigate('/admin/blocks')
13. BlockEditorSession.context.tsx  → bootstrap: arrival() → ticket with loot
                                    → resolveBlockBootstrapData() → inserts art into slot
                                    → restores edit mode with updated block
14. Admin clicks Save in SingleEditorToolbar
15. BlockEditorSession.context.tsx  → validate (validators.ts) → PUT /api/blocks/{id}
```

**Files:** `app/router.tsx` → `features/admin/blocks/blockEditorSession/BlockEditorSession.context.tsx` → `features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx` → `features/admin/shared/ui/BlockPreview/SlotChoiceMenu.tsx` → `shared/nav/journeySession.store.ts` → `features/admin/shared/transporter/transporter.ts` → `features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context.tsx` → `features/admin/blocks/blockEditorSession/bootstrap/blockEditorSession.bootstrap.resolver.ts` → `features/admin/blocks/utils/validators.ts` → `features/admin/blocks/api/blocksApi.ts`

---

### Scenario 3: Admin Builds a Stream from Blocks

```
 1. Admin navigates to /admin/streams
 2. StreamEditorSession.context.tsx → bootstrap: no ticket → load streamsIndex
 3. StreamsPage.tsx                 → renders stream grid (select mode)
 4. Admin clicks "New Stream"
 5. NewStreamComponent.tsx          → StreamMetaComponent form (title, description, tags)
 6. Admin submits → StreamEditorSession.context.tsx → POST /api/admin/streams
                  → push 'edit' mode
 7. SingleStreamEditor.tsx          → renders metadata + empty block list
 8. Admin clicks "Add Block" → useDispatch():
      ticket = { destination: { editor: 'block', mode: 'select' },
                 returnEffect: { kind: 'streamInsertBlock', streamId, insertAt } }
      → navigate('/admin/blocks')
 9. BlockEditorSession.context.tsx  → bootstrap: ticket outbound → show collection grid
10. Admin selects block → useReturnHome()
      → loot: { ok: true, id: blockId }
      → navigate('/admin/streams')
11. StreamEditorSession.context.tsx → bootstrap: ticket with loot
      → inserts blockId into stream.blockIds at position
      → streamStoreDirectSave(draft)
12. Admin reorders blocks (drag) → updates blockIds array
13. Admin clicks Save → PUT /api/admin/streams/{id} (with version for optimistic concurrency)
```

**Files:** `features/admin/streams/streamEditorSession/StreamEditorSession.context.tsx` → `features/admin/streams/ui/NewStreamComponent/NewStreamComponent.tsx` → `features/admin/streams/ui/SingleStreamEditor/SingleStreamEditor.tsx` → `features/admin/shared/transporter/transporter.ts` → `features/admin/blocks/blockEditorSession/BlockEditorSession.context.tsx` → `features/admin/streams/api/streamsApi.ts`

---

### Scenario 4: Admin Uploads Art via Hopper → Catalog

```
 1. Admin navigates to /admin/upload
 2. UploadPage.tsx                    → renders file drop zone
 3. Admin drops image files
 4. UploadPage.tsx                    → POST /api/upload (per file, max 50MB)
      → backend: SHA256 dedup, stores in /media/hopper/
      → returns { ok, sha256, url }
 5. Admin navigates to /admin/catalog
 6. CatalogEditorSession.context.tsx  → bootstrap: load catalog from store
 7. Admin clicks "Import from Hopper"
 8. CatalogEditorSession.context.tsx  → useDispatch():
      ticket = { destination: { editor: 'hopper', mode: 'select' },
                 returnEffect: { kind: 'createArtItem' } }
      → navigate('/admin/hopper')
 9. UploadPage.tsx (hopper mode)      → GET /api/hopper/content → list files
      → admin selects images
10. useReturnHome() → loot: { ok: true, id, output: GridItem }
      → navigate('/admin/catalog')
11. CatalogEditorSession.context.tsx  → bootstrap: ticket with loot
      → newArtItemFromGrid.ts → builds ArtItem shell from hopper file
      → opens CreateForm in edit mode
12. Admin fills metadata (title, technique, dimensions, price)
13. CreateForm.tsx → Validators.ts → POST /api/art/catalog/update
      → backend: catalog_service.py processes shipment, adds to catalog
```

**Files:** `pages/admin/UploadPage.tsx` → `features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context.tsx` → `features/admin/catalogEditor/catalogEditorSession/journeyService.ts` → `features/admin/catalogEditor/catalogEditorSession/editorLogic/newArtItemFromGrid.ts` → `features/admin/catalogEditor/ui/CreateForm/CreateForm.tsx` → `features/admin/catalogEditor/utils/Validators.ts`

Backend: `routers/hopper/upload.py` → `routers/hopper/hopper.py` → `routers/art/catalog.py` → `services/catalog_service.py` → `repos/catalog_repo.py`

---

### Scenario 5: Visitor Enrolls in an Event

```
 1. Browser → GET /gallery/:slug (stream page with event block)
 2. GalleryPage.tsx          → useGallery(slug)
 3. useGallery.ts            → GET /api/public/streams/{slug}
                              → GET /api/public/blocks?stream_id={id}
 4. GalleryBlock.tsx          → renders blocks; eventCta block found
 5. EventCtaView.tsx          → renders event card with "Enroll" button
                              → fetches event via useEvent(eventId) from EventsProvider
 6. Visitor clicks "Enroll"
 7. EnrollmentForm.tsx        → renders form (name, email)
 8. Visitor submits → POST /api/public/events/{eventId}/enroll
 9. Backend enrollments.py:
      → event_repo.get_event() → check status == 'scheduled'
      → create Enrollment (id, fullName, email, paymentStatus: 'pending')
      → if event.price > 0:
          stripe_service.create_checkout_session() → Stripe checkout URL
          return { status: 'checkout', checkoutUrl }
        else:
          return { status: 'free', enrollmentId }
10. If paid → browser redirects to Stripe checkout
      → Stripe webhook POST /api/public/stripe/webhook
      → verify signature → update enrollment paymentStatus = 'paid'
      → redirect to /enrollment/success
11. EnrollmentSuccessPage.tsx → confirmation message
```

**Files:** `pages/public/GalleryPage.tsx` → `features/public/hooks/useGallery.ts` → `features/public/ui/GalleryBlock/GalleryBlock.tsx` → `features/public/ui/EventCta/EventCtaView.tsx` → `features/public/ui/EventCta/EnrollmentForm.tsx` → `features/public/api/enrollmentApi.ts` → `pages/public/EnrollmentSuccessPage.tsx`

Backend: `routers/enrollments/enrollments.py` → `repos/event_repo.py` → `services/stripe_service.py`
