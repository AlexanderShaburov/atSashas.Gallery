---
type: architecture
scope: [architecture, system]
status: active
date: 2026-04-10
source_of_truth: true
tags: [fsd, frontend]
---

# Frontend layering model (Feature-Sliced Design)

## Layer structure

```
┌──────────────────────────────────────────────────┐
│  app/     Entry, routing, providers, layouts     │
├──────────────────────────────────────────────────┤
│  pages/   Route leaf components (lazy-loaded)    │
├──────────────────────────────────────────────────┤
│  features/  Business logic (admin + public)      │
│    ├── admin/blocks/           Block editor       │
│    ├── admin/streams/          Stream editor      │
│    ├── admin/catalogEditor/    Art catalog editor  │
│    ├── admin/eventEditor/      Event editor        │
│    ├── admin/eventPageEditor/  Event page editor   │
│    ├── admin/mediaEditor/      Media editor        │
│    ├── admin/textVisualEditor/ TextVisual editor   │
│    ├── admin/publicStream/     Home page manager   │
│    ├── admin/EditorWorkspace/  Admin data preloader │
│    ├── admin/shared/           Transporter, guards │
│    ├── auth/                   Auth context + API  │
│    └── public/                 Gallery rendering   │
├──────────────────────────────────────────────────┤
│  entities/  Pure domain models (no UI/effects)    │
│    art/, block/, catalog/, common/, event/,       │
│    homeDoc/, hopper/, mediaItem/,                 │
│    renderable/, stream/, textVisual/              │
├──────────────────────────────────────────────────┤
│  shared/    Stores, nav, lib, ui primitives       │
│    state/, nav/, lib/, ui/, galleryLayouts/,     │
│    analytics/, ArtCatalogProvider/                │
└──────────────────────────────────────────────────┘
```

## Route map (verified against router.tsx)

### Public routes
```
/                        → HomePage
/gallery/:slug           → GalleryPage
/about                   → AboutPage
/events                  → PublicEventsPage
/event/:id               → EventPage
/enrollment/success      → EnrollmentSuccessPage
/enrollment/cancel       → EnrollmentCancelPage
```

### Preview routes (auth required)
```
/preview/                → HomePage (mode="preview")
/preview/event/:id       → EventPage (mode="preview")
/preview/:slug           → GalleryPage (mode="preview")
```

### Admin routes (auth required)
```
/admin/login             → LoginPage
/admin                   → AdminIndex
/admin/upload            → UploadPage
/admin/catalog           → CatalogEditorPage       ← CatalogEditorSessionProvider
/admin/blocks            → BlocksPage              ← BlockEditorSessionProvider
/admin/streams           → StreamsPage             ← StreamEditorSessionProvider
/admin/event-pages       → EventPagesPage          ← EventPageEditorSessionProvider
/admin/home              → HomeEditorPage          ← HomeEditorSessionProvider
/admin/text-visuals      → TextVisualsPage         ← TextVisualEditorSessionProvider
/admin/media             → MediaPage               ← MediaEditorSessionProvider
/admin/hopper            → UploadPage
```

## Provider chains (verified)

**Public routes:**
```
AppProviders (ThemeProvider → AuthProvider)
  → ArtCatalogLoader (mode="public")
    → PublicLayout (Header + Outlet + Footer)
```

**Admin routes:**
```
AppProviders (ThemeProvider → AuthProvider)
  → RequireAuth
    → ArtCatalogLoader (mode="admin")
      → EditorWorkspaceProvider (= AdminDataPreloader, preloads 4 stores)
        → AdminLayout (AdminHeader + DestructiveOverlay + Outlet)
          → [per-route SessionProvider wraps page component]
```

**EditorWorkspaceProvider** is a side-effect wrapper (NOT a context). It preloads:
catalogStore, blocksCollectionStore, streamsIndexStore, mediaItemsStore.

## Related

- [Downward-only dependencies](../invariants/invariant--architecture--downward-only-dependencies.md)
- [FSD decision](../decisions/decision--architecture--feature-sliced-design.md)
