## Restructure steps:

1. Create new structure:

```bash
src/
  app/
    layouts/
      AdminLayout.tsx
      PublicLayout.tsx
      PublicLayout.module.css
    providers/
      AppProviders.tsx
      ThemeProvider.tsx
    index.css
    main.tsx
    router.tsx
----------------------- ok
  pages/
    admin/
      AdminIndexPage.tsx
      CatalogEditorPage.tsx
      UploadPage.tsx
      StreamsPage.tsx
      BlocksPage.tsx
    public/
      HomePage.tsx
      AboutPage.tsx
    NotFound.tsx
----------------------- ok
  entities/
    art/
      ArtItem.types.ts
      images.ts
      techniques.ts                // (pure TS + typed helpers)
      techDerivatives.ts
      index.ts
    block/
      Block.types.ts
      index.ts
    catalog/
      catalog.types.ts
      index.ts
    common/
      ApiResponse.types.ts
      Tags.types.ts
      dimensions.ts
      locales.ts
      money.ts
      primitives.ts
      themes.ts
      index.ts
    stream/
      stream.types.ts
      index.ts
----------------------- ok
  features/
    admin/
      api/
        index.ts
      model/
        adminStore.ts
      ui/
        CatalogGrid/
          CatalogGrid.tsx
          CatalogGrid.module.css
        HopperGrid/
          HopperGrid.tsx
          HopperGrid.module.css
        CreateForm/
          CreateForm.tsx
          CreateForm.module.css
          UX/
            DimensionsInput.tsx
            LangInput.tsx
            MoneyInput.tsx
            NumericInput.tsx
        SingleItemEditor/
          SingleItemEditor.tsx
          SingleItemEditor.module.css
        StreamEditor/
          StreamEditor.tsx
        FiltersBar/
          FiltersBar.tsx

    gallery/
      api/
        CatalogProvider.tsx
        catalogModule.ts
      hooks/
        useGallery.ts
      ui/
        GalleryBlock/
          GalleryBlock.tsx
----------------------- ok
        GalleryStream/
          GalleryStream.tsx
        Image/
          ImageComponent.tsx
        Text/
          TextComponent.tsx

  shared/
    api/
      http.ts
    data/
      techniques.const.ts
    assets/
      react.svg
    lib/
      date/Today.tsx
      theme/ThemeContext.tsx
    ui/
      Header/
        Header.tsx
        header.css
        headerComponents/...
      BottomBar/
        BottomBar.tsx
        bottomBar.css
      Lightbox/
        Lightbox.tsx

  declarations.d.ts

docs/
  admin-vision.md
```

✅

2. Move files according folder tree.✅
3. Check completeness✅
4. Rename files;
    - all single-item-editor.css -> SingleItemEditor.css

```bash
$ find . -name "*.css"
./apps/frontend/gpt.css👎
./apps/frontend/src/app/index.css👎
./apps/frontend/src/app/layouts/PublicLayout.module.css✅
./apps/frontend/src/features/gallery/ui/GalleryBlock/Gallery.module.css✅
./apps/frontend/src/features/admin/ui/CreateForm/CreateForm.css✅
./apps/frontend/src/features/admin/ui/HopperGrid/HopperGrid.css✅
./apps/frontend/src/features/admin/ui/SingleItemEditor/SingleItemEditor.css✅
./apps/frontend/src/shared/footer/bottomBar.css✅
./apps/frontend/src/shared/header/headerComponents/menuButton/menuButton.css✅
./apps/frontend/src/shared/header/headerComponents/menuButton/menu.css✅
./apps/frontend/src/shared/header/headerComponents/themeSwitcher/themeSwitcher.css✅
./apps/frontend/src/shared/header/headerComponents/instagram/instagramButton.css✅
./apps/frontend/src/shared/header/header.css✅
./apps/frontend/src/pages/admin/CatalogEditorPage.css✅
./apps/frontend/src/pages/admin/AdminIndex.css✅
./apps/frontend/src/pages/admin/Upload.css✅
./apps/frontend/src/pages/public/home.css✅
```

    - all .css -> .module.css✅
    - all dimensionsInput.tsx -> DimensionsInput.tsx✅

5. Update import links;✅
6. Check operability
