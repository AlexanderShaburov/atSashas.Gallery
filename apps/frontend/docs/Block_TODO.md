---

## 0. Цель модуля / блока (понять головой перед кодом)

1. Ответить себе на вопросы:

   * Что такое **Block / Module** в системе?

     * Это композиция из одного или нескольких `ArtItem`, плюс опциональный текст, заголовок, доп. мета.
   * Где это будет использоваться?

     * На публичном сайте: ленты работ, спец-страницы, промо-блоки и т.д.
   * Что является **источником истины для картинок**?

     * Всегда `ArtItem` из каталога (по `id`), блок только хранит ссылки (`artId`), но не дублирует данные.

2. Зафиксировать важный принцип:

   * **Блоки ничего не знают о файлах** — только об `ArtItem.id`.
   * Все визуальные данные блока собираются на фронте (или на бэке) через `catalog.items[artId]`.

---

## 1. Структура данных для Block / Module

Подумать и набросать, чего нам нужно **минимально** (без фанатизма):

1. **Layout / тип блока**
    - Enum: например:
        - `single`
        - `pair`
        - `triptych`
        - `mosaicLeft`
        - `mosaicRight`
        - `fullWidthHero`
        - `textOnly`

    - Задать себе вопрос: какие 2–3 типа нужно **сначала**, остальные можно добавить позже.

2. **Состав блока**
    - `id: string` — уникальный идентификатор блока.
    - `title?: Localized` — опциональный заголовок блока.
    - `description?: Localized` — описание / подпись.
    - `items: BlockItem[]` — элементы внутри блока.

3. **BlockItem**
    - `artId: string` — ссылка на `ArtItem.id`.
    - `role?: 'primary' | 'secondary' | 'background'` (если понадобится).
    - `caption?: Localized` — если нужно отдельное описание именно в контексте блока.
    - `highlight?: boolean` — флаг выделения, если пригодится.

4. **Метаданные блока**
    - `slug?: string` — человекочитаемый ID (для стримов / роутинга).
    - `tags?: string[]` — можно будет фильтровать.
    - `isPublished: boolean` — готов ли блок к публикации.
    - `createdAt/updatedAt` — если хочешь отслеживать историю.

5. **Коллекция блоков**
    - Файл вроде `vault/json/blocks/blocks.json`:

        ```ts
        interface BlocksJSON {
            blocks: Record<string, Block>;
            order: string[]; // порядок блоков по умолчанию
        }
        ```

    - Подумать, будет ли отдельный объект для Streams или пока достаточно одного списка блоков.

---

## 2. TypeScript-модель (frontend)

1. Определить интерфейсы в `/entities/blocks` (или похожем месте):

    ```ts
    export type BlockLayout =
        | 'single'
        | 'pair'
        | 'triptych'
        | 'mosaicLeft'
        | 'mosaicRight'
        | 'fullWidthHero'
        | 'textOnly';

    export interface BlockItemRef {
        artId: string;
        role?: 'primary' | 'secondary' | 'background';
        caption?: Localized;
        highlight?: boolean;
    }

    export interface Block {
        id: string;
        layout: BlockLayout;
        title?: Localized;
        description?: Localized;
        items: BlockItemRef[];
        slug?: string;
        tags?: string[];
        isPublished: boolean;
    }

    export interface BlocksJSON {
        blocks: Record<string, Block>;
        order: string[];
    }
    ```

2. Подумать:
    - Нужен ли **отдельный тип для Draft** (`BlockDraft`, как с `ArtItem`), или можно начать с простого `Block` и уже потом размножить.
    - Какие поля реально нужны на **первом этапе**, а какие можно позже прикрутить (например, `slug`, `tags`).

---

## 3. Pydantic-модель (backend)

Задача на завтра/послезавтра, но подумать уже сейчас:

1. Сделать зеркальные модели в Python:
    - `BlockLayout` как `Literal[...]` или `Enum`.
    - `BlockItemRef(BaseModel)` + `Block(BaseModel)` + `BlocksJSON(BaseModel)`.

2. Определить, где хранить:
    - `vault/json/blocks/blocks.json` (аналог `catalog.json`).
    - Возможно, позже: `streams/<slug>.json` как композиция блоков.

3. Продумать функции:
    - `load_blocks()`, `save_blocks()`, `validate_blocks()`:
        - Проверять, что **все `artId` существуют в каталоге**.
        - Проверять, что количество `items` соответствует `layout` (например, `pair` — 2 элемента и т.п.).

---

## 4. Логика интерфейса для Blocks / Modules Page

Представить будущую страницу **Blocks / Modules** (аналог `CatalogEditorPage`):

1. **Режимы страницы**
    - `mode: 'list' | 'create' | 'edit'`
    - Вопрос: хотим ли такое же разделение, как `create/edit` в каталоге, или пока только:
        - слева — список блоков,
        - справа — редактор выбранного/нового блока.

2. **Состояния, которые нужно хранить в контексте**
    - `blocks: Block[]` или `BlocksJSON`.
    - `catalog: Catalog` (чтобы выбирать `ArtItem` в блок).
    - `selectedBlockId?: string`.
    - `blockDraft?: Block` (редактируемый блок).
    - `isDirty`, `canSave`, `saving` — как в EditorSession.

3. **Основные действия (методы контекста)**
    - `loadBase()` — загрузить blocks + catalog.
    - `startCreateBlock()` — создать черновик нового блока.
    - `startEditBlock(id)` — открыть существующий блок.
    - `updateBlockDraft(patch)` — менять поля layout/title/items.
    - `addArtToBlock(artId)` — добавить `ArtItem` в `Block.items`.
    - `removeArtFromBlock(artId)` — удалить.
    - `reorderItems(...)` — позже, когда появится drag’n’drop.
    - `saveBlock()` — собрать payload и отправить на бэкенд.
    - `deleteBlock(id)` — удалить блок.
    - `exitBlockSession()` — сбросить `blockDraft`, `selectedBlockId`, `isDirty`, обновить список блоков.

---

## 5. UI-логика: как будет выглядеть редактор блока

Представить интерфейс в голове до верстки:

1. **Левая колонка / панель**
    - Список существующих блоков:
        - `title` или `id`,
        - layout-иконка,
        - published / draft индикатор.

    - Кнопка `+ New Block`.

2. **Правая часть — редактор блока**
    - Поля:
        - выбор `layout` (селект).
        - `title`, `description`.

    - Визуальный preview-компонент:
        - отображает блок в миниатюре, используя `ArtItem` из каталога.

    - Зона с выбранными `ArtItem`:
        - карточки с возможностью удалить.

    - Кнопка/панель для добавления новых арт-объектов:
        - модальное окно или панель справа с **каталог-гридом** (переиспользовать HopperGrid-стиль, но уже на основе `catalogGrid`).

3. **Кнопки управления**
    - `Save block`.
    - `Exit` (вернуться к списку без редактора).
    - Возможно, `Duplicate block` (потом).

---

## 6. Связь Blocks с Catalog / ArtItem

Подумать заранее, чтобы завтра меньше сомневаться:

1. Принципы:
    - блок **не хранит** копию `ArtItem`, только `artId`.
    - все картинки, названия, техника и пр. для отображения блока берутся через:

        ```ts
        const art = catalog.items[artId];
        ```

2. Что будет, если:
    - `ArtItem` удалён из каталога, но используется в блоке?
        - Нужен валидатор на бэке: при сохранении блоков проверять, что все `artId` существуют.
        - В UI можно показывать предупреждение, если что-то отсутствует.

---

## 7. Мини-TODO по шагам реализации (на завтра/послезавтра)

1. **На бумаге / в голове**
    - Досформулировать `Block` и `BlockItemRef`.
    - Решить, какие layout-значения нужны сейчас (2–3 штуки).

2. **В коде (frontend)**
    - Создать `/entities/blocks` с интерфейсами `Block`, `BlockItemRef`, `BlockLayout`, `BlocksJSON`.
    - Добавить набросок `BlocksSession.context.tsx` (по аналогии с `EditorSession`):
        - только состояние и пустые заглушки методов.

3. **В коде (backend) — черновик**
    - Определить Pydantic-модели `Block`, `BlockItemRef`, `BlocksJSON`.
    - Добавить очень простой `blocks.json` (хотя бы пустой объект).
    - Сделать один эндпоинт `GET /blocks` с заглушкой.

4. **UI-страница**
    - Создать новый route `BlocksPage` / `ModulesPage`.
    - Сделать базовый layout:
        - слева список блоков (пока пустой),
        - справа заглушка «Select block or create a new one».

---

Если хочешь, потом на основе этого ToDo я могу:

- превратить разделы 2–3 в конкретные файлы (`.ts` + `.py`) с черновыми моделями,
- или нарисовать схему: `Catalog` → `Blocks` → `Streams`, чтобы было прям визуально понятно, как всё связано.
