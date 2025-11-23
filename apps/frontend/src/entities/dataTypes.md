## // cspell:disable

---

## 1. **Доменный слой** (данные, которые реально хранятся в каталоге)

### ### `ArtItemData`

Каноническая модель арт-объекта — именно этот формат лежит в JSON на бэкенде.

```ts
export interface ArtItemData {
    id: string;
    dateCreated: ISODate;
    title?: Localized;
    techniques: string[];
    availability: Availability;
    dimensions: Dimensions;
    price?: Money;
    alt?: Localized;
    series?: string;
    tags: string[];
    notes?: string;
    images: ImagesJSON;
}

Использование:
хранение каталога на бэкенде,
загрузка/сохранение через API,
доменный класс ArtItem работает ровно с этим типом,
валидируется при сохранении.
### ArtItem
Доменный класс над ArtItemData: хранит логику, гарантии и упрощённые методы.
export class ArtItem {
    readonly data: ArtItemData;

    constructor(data: ArtItemData) { ... }

    static fromJSON(json: ArtItemData): ArtItem { ... }
    toJSON(): ArtItemData { ... }
}
Использование:
создание/валидация доменных объектов,
защита от некорректного состояния,
преобразование JSON → объект → JSON.

*********************************

2. Слой формы (UI редактирования одного арт-объекта)
### ArtItemForm
(бывший FormValues, формат твоей реальной формы)
export interface ArtItemForm {
    id: string;
    dateCreated: ISODate;
    title: Localized | undefined;
    techniques: string[];
    availability: Availability | undefined;
    dimensions: Dimensions | undefined;
    price: Money | undefined;
    alt: Localized | undefined;
    series: string | undefined;
    tags: string[] | undefined;
    notes: string | undefined;
}
Использование:
состояние useState формы в SingleItemEditor,
данные для всех input-компонентов (MoneyInput, DimensionsInput, title, alt, tags...),
НЕ содержит изображений, НЕ знает про hopper.
### Адаптеры между формой и доменом
Реализация — чистые функции, НЕ методы класса.
ArtItemData → ArtItemForm
function artItemDataToForm(data: ArtItemData): ArtItemForm { ... }
ArtItemForm + ImagesJSON → ArtItemData
function artItemDataFromForm(form: ArtItemForm, images: ImagesJSON): ArtItemData { ... }
Использование:
при открытии работы в редакторе (edit),
при сборке данных перед отправкой в каталог.
3. Каталог
### ArtCatalog
Полная структура каталога, которая лежит в JSON и отдаётся фронту.
export interface ArtCatalog {
    catalogVersion: number;
    updatedAt: string;
    order: string[];
    items: Record<string, ArtItemData>;
}
Использование:
редактор каталога,
сохранение/загрузка,
валидация (order соответствует items).


*********************************
4. Режимы редактирования
### ItemMode
export const ITEM_MODE = ['create', 'edit'] as const;
export type ItemMode = (typeof ITEM_MODE)[number];
### EditorIdentity
export type EditorIdentity = {
    mode: ItemMode;
    id: string;
};
Использование:
SingleItemEditor,
роутинг /admin/catalog/edit/:id,
логика “создаём или редактируем”.

*********************************
5. Гриды и view-модели
(для отображения на страницах Upload и Catalog)
### GridItemSources
export interface GridItemSources {
    avif?: string;
    webp?: string;
    jpeg?: string;
}

*********************************
### GridItem (базовый)
export interface GridItem {
    id: string;
    thumbUrl: string;
    sources?: GridItemSources;
    title?: string;
    badge?: string;
}
### HopperGridItem
Представление файлов во временной зоне (hopper).
export interface HopperGridItem {
    id: string;
    thumbUrl: string;
    fileName?: string;
}
### CatalogGridItem
Представление картины в сетке каталога.
export interface CatalogGridItem {
    id: string;
    thumbUrl: string;
    title?: string;
    badge?: string;
}


Использование:
HopperGridItem — страница загрузки (HopperGrid),
CatalogGridItem — страница каталога,
GridItem — общий базовый интерфейс.
6. Служебные типы
### ApiResponse<T>
Маленький generic для API.
export interface ApiResponse<T> {
    key: string;
    data: T;
}
Использование:
типизация API-ответов клиента (получение каталога, сохранение, получение hopper).


*********************************
🎯 SUMMARY — краткий список всего
Домен
ArtItemData
ArtItem
Форма
ArtItemForm (бывший FormValues)
artItemDataToForm()
artItemDataFromForm()
Каталог
ArtCatalog
Режимы
ItemMode
EditorIdentity
Гриды / View-модели
GridItemSources
GridItem
HopperGridItem
CatalogGridItem
Служебные
ApiResponse<T>
```
