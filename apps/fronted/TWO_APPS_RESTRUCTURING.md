**WHAT WE WHAT TO GET:**
```bash
src/
  app/                         # общие shell/роутер/глобальные провайдеры
    router.tsx
    providers/
  features/
    gallery/                   # публичный сайт (домен "галерея")
      pages/
        GalleryPage.tsx
      components/
        GalleryBlock.tsx
      api/
      hooks/
      index.ts                 # barrel exports
    admin/                     # админка (домен "админ")
      pages/
        UploadPage.tsx
        CatalogPage.tsx
        BlocksPage.tsx
        StreamsPage.tsx
      components/
        HopperGrid.tsx
        CatalogGrid.tsx
        BlockEditor.tsx
        StreamEditor.tsx
        FiltersBar.tsx
      store/
        adminStore.ts          # Zustand/Context
      api/
        index.ts               # getCatalog, saveCatalog, uploadImage, ...
      index.ts
  entities/                    # строгие доменные сущности + типы
    art/
      model.ts                 # ArtItem, ArtCatalog, схемы zod (клиент)
      ui/                      # очень базовые карточки/превью (без бизнес-логики)
    block/
      model.ts                 # Block, BlockItemRef, BlockLayout
    stream/
      model.ts                 # StreamData
  shared/                      # реально универсальные вещи (без домена)
    ui/                        # кнопки, инпуты, модалки, гриды, тулбары
    lib/                       # хелперы (slugify, date, fetcher, dnd utils)
    config/                    # константы, env-helpers
    api/                       # fetch/json helpers, error handling
    types/                     # общие типы
```
**WHAT WE HAVE:**
```bash
src/
┣ admin/
┃ ┣ ADMIN_VISION.md
┃ ┣ AdminApp.tsx
┃ ┗ api.ts
┣ app/
┣ assets/
┃ ┗ react.svg
┣ components/
┃ ┣ footer/
┃ ┃ ┣ BottomBar.tsx
┃ ┃ ┗ bottomBar.css
┃ ┣ header/
┃ ┃ ┣ headerComponents/
┃ ┃ ┃ ┣ images/
┃ ┃ ┃ ┣ instagram/
┃ ┃ ┃ ┣ menuButton/
┃ ┃ ┃ ┣ themeSwitcher/
┃ ┃ ┃ ┗ Logo.tsx
┃ ┃ ┣ Header.tsx
┃ ┃ ┗ header.css
┃ ┣ layouts/
┃ ┃ ┗ MainLayout.tsx
┃ ┗ lightbox/
┃   ┗ Lightbox.tsx
┣ features/
┃ ┗ gallery/
┃   ┣ components/
┃ ┃ ┃ ┣ GalleryBlock.tsx
┃ ┃ ┃ ┣ GalleryStream.tsx
┃ ┃ ┃ ┣ ImageComponent.tsx
┃ ┃ ┃ ┣ TextComponent.tsx
┃ ┃ ┃ ┣ catalogModule.ts
┃ ┃ ┃ ┗ gallery.css
┃   ┣ hooks/
┃ ┃ ┃ ┗ useGallery.ts
┃   ┣ types/
┃ ┃ ┃ ┣ artUnit.ts
┃ ┃ ┃ ┣ catalog.ts
┃ ┃ ┃ ┣ dimensions.ts
┃ ┃ ┃ ┣ images.ts
┃ ┃ ┃ ┣ index.ts
┃ ┃ ┃ ┣ locales.ts
┃ ┃ ┃ ┣ money.ts
┃ ┃ ┃ ┣ primitives.ts
┃ ┃ ┃ ┗ themes.ts
┃   ┣ CatalogProvider.tsx
┃   ┣ GalleryPage.tsx
┃   ┗ techiques.dict.ts
┣ models/
┃ ┣ ArtItem.ts
┃ ┣ Block.ts
┃ ┣ Tags.ts
┃ ┗ index.ts
┣ packages/
┣ pages/
┃ ┣ About/
┃ ┃ ┗ About.tsx
┃ ┣ Home/
┃ ┃ ┣ Home.tsx
┃ ┃ ┗ home.css
┃ ┗ NotFound.tsx
┣ styles/
┣ theme/
┃ ┗ ThemeContext.tsx
┣ utils/
┃ ┣ Today.tsx
┃ ┗ index.ts
┣ App.css
┣ App.tsx
┣ declarations.d.ts
┣ index.css
┗ main.tsx
```