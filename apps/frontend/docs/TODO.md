## TODO 21.nov.25

1. To catalog page - edit/create add buttons:
    - Add to hooper/download
    - Delete file. Delete file has to be available also in edit mode. I should delete
      file form hopper or catalog. In case hopper - physical delete file from hopper and
      renew hopper. In catalog case - delete full size image, all its previews and
      delete item from catalog.
2. On the catalog page build:
    1. Display catalog content (_the same way as hopper does_)
    2. Add same functions to catalog view as in "create" view.

## FOR Blocks and Stream modules implementation stage:

// TODO:
// When Blocks and Streams are implemented:
// - check real dependencies
// - prevent deletion if item is part of locked or published stream
// - implement placeholder item for removed artworks
// - update blocks by replacing removed item with placeholder token

День 1 — Блоки полностью: BlockEditor + BlockPage
Главная цель дня:
➡️ полностью рабочий BlockEditor, который умеет создавать и редактировать блоки двух типов:
GalleryBlock
TextBlock
Задачи дня

1. Типы и доменная модель (быстро, на 30–40 минут)
   Определить минимальный набор типов:
   export type GalleryBlock = {
   kind: 'gallery';
   id: string;
   layout: 'single' | 'pair';
   items: string[]; // art item ids
   };

export type TextBlock = {
kind: 'text';
id: string;
layout: 'full';
text: Localized;
};

export type Block = GalleryBlock | TextBlock;
При необходимости — BlockDraft с лёгкой логикой mode: 'create' | 'edit'. 2. Block Editor Session (ядро редактора)
Создать или доработать:
BlockEditorSessionProvider
useBlockSession()
Что должно уметь:
хранить draft,
отдавать API:
setKind(kind)
updateDraft(partial)
addItemToGallery(id)
removeItem(id)
setText(text)
setLayout(layout)
режимы:
create → draft пустой
edit → draft заполнен существующим блоком 3. BlockEditor UI
Сделать полноценный компонент для редактирования одного блока:
выбор типа (gallery | text) — если новый блок
для TextBlock:
textarea/input
для GalleryBlock:
список ID (пока просто текстом)
кнопка “Добавить картину” (без picker'а — просто вручную id или временно через prompt)
layout:
dropdown (single, pair)
Важно:
Не делай сейчас сложных UI:
главное — логика работает. 4. BlockPage
Страница:
/admin/blocks/:id
или компонент, который используется:
в режиме create — пустой draft
в режиме edit — грузит блок
имеет кнопки:
“Save”
“Cancel/Exit” (просто возврат назад)
После сохранения сохраняет готовый Block в backend (или пока локально).
Результат дня:
✔ полностью рабочий BlockEditor
✔ сохранение блока (локально или в /blocks JSON)
✔ возможность создать/редактировать блок без стримов
Ты закрываешь самую сложную часть — редактор блока, который завтра станет частью StreamEditor.
День 2 — Streams: сборка страницы из блоков
Главная цель:
➡️ Можно открыть StreamEditor → добавить/удалить/переставить блоки → сохранить → посмотреть Stream.
Задачи дня
Тип StreamData:
export interface StreamData {
id: string;
slug: string;
title: string;
blocks: Block[];
tags: string[];
}
Backend:
GET /streams
GET /streams/{slug}
PUT /streams/{slug}
Admin:
StreamsListPage
StreamEditorPage:
список блоков
кнопка “Add Block” → открывает BlockEditor в режиме create
кнопка “Edit Block” → открывает BlockEditor в режиме edit
кнопка “Delete Block”
кнопка “Save stream”
Использовать уже готовый BlockEditor из Дня 1.
Результат дня:
✔ можно собирать Stream из готовых блоков
✔ можно редактировать блоки внутри стрима
✔ можно сохранить стрим в JSON
День 3 — Публичный рендер стрима + шлифовка
Главная цель:
➡️ публичная страница по адресу /s/:slug рендерит блоки из стрима.
Задачи дня
Public StreamPage:
GET /streams/{slug}
рендер блоков:
TextBlock
GalleryBlock (пока простой)
Связка с каталогом:
загрузить весь каталог (или по id)
подставлять изображения в галерею
Минимальный дизайн:
отступы
шрифты
базовые layout’ы
Если останется время:
кнопки перемещения блока вверх/вниз
общий список стримов в публичной части
начальная главная страница как стрим
Результат дня:
✔ стримы отображаются на публичном сайте
✔ весь вертикальный срез готов
✔ система работоспособна end-to-end
