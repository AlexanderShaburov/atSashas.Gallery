1. ## В vite.config.ts укажем алиасы и поменяем entry-импорт на @app/main.
2. ## src/admin/AdminApp.tsx → разложить на страницы:
    - src/features/admin/pages/UploadPage.tsx
    - src/features/admin/pages/CatalogPage.tsx
    - src/features/admin/pages/BlocksPage.tsx
    - src/features/admin/pages/StreamsPage.tsx
3. ## src/admin/api.ts → src/features/admin/api/index.ts
**(разбей на функции: getCatalog, saveCatalog, getStreams, saveStreams,uploadImage, importFromHopper, listHopper).**

4. ## API-слой
features/admin/api/index.ts — ок. Для публички приготовь зеркальный features/gallery/api/ (ты уже оставил папку).
➜ Утильную сеть (fetch/json, обработка ошибок, baseURL, токен) вынеси в shared/lib/api (маленький helper), чтобы не дублировать.
5. ## Auth / Guard (на потом, но важно)
Для /admin/* добавь “guard” (пока хотя бы Basic/Token). В роутере оборачивай AdminLayout в RequireAuth (и положи это в app/providers или features/admin/lib).?????