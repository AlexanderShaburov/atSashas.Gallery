ver 26.01.26

# BlockEditorSessionProvider

> Session-level provider that orchestrates the entire block editing workflow.
>
> This document explains **what this provider does**, **why it exists**, and **how its internal logic is structured**.
>
> The goal is long-term maintainability: when returning to this code after refactors,
> this document should restore context quickly.

---

## 📌 Contents

- [RU — Общее описание](#ru--общее-описание)
- [RU — Состояния](#ru--состояния)
- [RU — Хуки и инфраструктура](#ru--хуки-и-инфраструктура)
- [RU — Управление режимами](#ru--управление-режимами)
- [RU — Жизненный цикл](#ru--жизненный-цикл)
- [RU — Save и Journey](#ru--save-и-journey)
- [RU — Обработка кликов](#ru--обработка-кликов)
- [RU — Возврат из Journey](#ru--возврат-из-journey)
- [RU — Legacy и будущие изменения](#ru--legacy-и-будущие-изменения)

- [EN — Overview](#en--overview)
- [EN — State Model](#en--state-model)
- [EN — Lifecycle](#en--lifecycle)
- [EN — Save & Journey](#en--save--journey)
- [EN — Click Handling](#en--click-handling)
- [EN — Technical Debt](#en--technical-debt)

---

# RU — Общее описание

## Назначение

**BlockEditorSessionProvider** — это сессионный провайдер редактора блоков.

Он отвечает не только за UI, а за **полный жизненный цикл редактирования блока**:

- загрузку коллекции блоков с бэкенда
- выбор блока
- редактирование содержимого
- управление режимами экрана
- обработку кликов по блокам
- сохранение изменений
- интеграцию с механизмом **Journey (путешествий между редакторами)**

> ⚠️ Важно:  
> Это **не UI-провайдер**, а **оркестратор редакторской сессии**.

---

# RU — Состояния

## Workspace (legacy)

### `useEditorWorkspace`

Провайдер читает верхнеуровневый Workspace:

- содержит shared-состояния других редакторов
- используется как временное связующее звено

**Статус:** legacy  
**Будущее:** внешний Store

---

## Collection

### `collection / setCollection`

- Актуальная коллекция блоков
- Загружается с бэкенда
- Используется в режиме `select`
- Может обновляться через `refreshCollection`

---

## Draft

### `draft / setDraft`

- Текущий редактируемый блок
- Основной объект редактирования
- `null`, если редактор в режиме выбора

---

## Mode Stack

### `modeStack`

Стек режимов экрана редактора.

Примеры:

- `select`
- `edit`
- `meta`
- `error`

**Правило:**  
последний элемент стека — активный режим.

Используется:

- UI-компонентами
- Escape-логикой
- тулбарами

---

## Editor Mode (derived)

Производное состояние, вычисляемое из `modeStack`.

UI использует его, чтобы понять:

- что сейчас отображать
- какие действия доступны

---

## Current Target

### `currentTarget`

Контекст клика.

Хранит информацию:

- по какому блоку кликнули
- по какому элементу внутри блока

Используется для:

- inline-редактирования
- замены изображений
- контекстных действий

> Отличие от тулбаров:  
> тулбары — **команды**,  
> `currentTarget` — **контекст клика**.

---

## Journey Ticket (Johnny)

Закэшированный Journey-ticket.

- читается один раз
- сохраняется на время сессии
- избавляет от постоянного `peekTicket`

---

## UI-driven states

- `loading`
- `saving`

Используются исключительно UI.

---

## Pending Selection (legacy)

Использовался для:

- выбора изображения из арт-каталога
- без выхода из контекста провайдера

**Статус:** transitional  
**Будущее:** должен быть перенесён в Journey ticket

---

## UI Error State

State для централизованного управления ошибками.

- задуман
- но пока используется минимально

---

## Snapshot

User snapshot (`ref`).

- используется для сравнения изменений
- кандидат на вынос во внешний Store

---

# RU — Хуки и инфраструктура

Используемые хуки Journey-механизма:

- `useArrival`
- `useReturnHome`
- `usePickTicket`

Это **инфраструктурные** хуки, не UI.

---

# RU — Управление режимами

## pushMode

Добавляет новый режим в `modeStack`.

---

## onEscape

Удаляет верхний режим, если стек содержит больше одного элемента.

---

## currentStack (useMemo)

Комбинированный объект:

- текущий режим
- текущее состояние стека
- доступные действия

Используется UI:

- Escape
- кнопки тулбара
- визуальные индикаторы

---

# RU — Жизненный цикл

## Preload

### `refreshCollection`

- Загружает коллекцию блоков
- Вызывается:
    - при монтировании
    - при необходимости обновления

---

## Mount Bootstrap

При инициализации провайдера:

1. Проверяется наличие Journey-ticket
2. Если ticket есть:
    - редактор инициализируется как часть путешествия
3. Если нет:
    - стартует в режиме `select`

> Логика возврата из путешествия описана,
> но пока не полностью задействована (каталог-редактор не поддерживает Journey).

---

# RU — Save и Journey

## save (процедура)

- Асинхронное сохранение блока
- Не привязана напрямую к UI

---

## onSaveClick

UI-хендлер:

1. Вызывает `save`
2. Выполняет post-save обработку
3. Проверяет:
    - находимся ли мы в Journey
4. При необходимости:
    - возвращает пользователя назад
    - или остаётся в редакторе

**Важно:**  
Все toolbar-хендлеры — `void async` (не возвращают Promise наружу).

---

# RU — Обработка кликов

## onHit

Единая точка входа для кликов по блоку.

Получает `BlockHitEvent`.

---

## Ветвление

- `select` → `handleSelectHit`
- `edit` → `handleEditHit`

Каждый hit содержит:

- тип действия
- target
- дополнительный контекст

---

# RU — Возврат из Journey

## setSelectedArtItem

Вызывается при возврате из Journey:

1. Получаем `artItemId`
2. Берём сохранённый `currentTarget`
3. Определяем точку вставки
4. Выполняем вставку в блок

Это основная точка интеграции:

**Journey → BlockEditor**

---

# RU — Legacy и будущие изменения

| Элемент           | Статус               |
| ----------------- | -------------------- |
| Workspace         | Legacy               |
| Pending Selection | Уходит в Journey     |
| Snapshot          | Внешний Store        |
| UI Error          | Недоиспользован      |
| Mode Stack        | Требует стабилизации |

---

# EN — Overview

## Purpose

`BlockEditorSessionProvider` orchestrates the **entire block editing session**.

It is responsible for:

- loading block collections
- selecting and editing blocks
- managing editor screen modes
- handling click events
- saving changes
- integrating with the Journey navigation mechanism

This is **not a UI-only provider**, but a **session-level coordinator**.

---

# EN — State Model

- `collection` — current block collection
- `draft` — active editable block
- `modeStack` — editor screen modes stack
- `editorMode` — derived UI mode
- `currentTarget` — click context
- `journeyTicket` — cached Journey ticket
- `loading / saving` — UI states
- `pendingSelection` — legacy (to be moved to Journey)
- `uiError` — centralized error handling (underused)
- `snapshotRef` — user snapshot (candidate for external store)

---

# EN — Lifecycle

On mount:

- Check for a Journey ticket
- Initialize editor accordingly:
    - journey-driven mode
    - or default `select` mode

---

# EN — Save & Journey

- `save()` performs async persistence
- `onSaveClick()`:
    - triggers save
    - runs post-save logic
    - decides whether to return via Journey or remain in editor

All toolbar handlers are **void-async**.

---

# EN — Click Handling

- All block clicks go through `onHit`
- Routed by mode:
    - select → `handleSelectHit`
    - edit → `handleEditHit`

---

# EN — Technical Debt

- Workspace should move to an external store
- Pending selection must migrate to Journey
- Snapshot should be externalized
- Mode stack logic requires stabilization
- UI error handling can be expanded

---
