Отлично, по твоей структуре видно сразу 2 “правильных места” для такого overlay, и можно встроиться вообще без ломки архитектуры.

## Куда класть DeleteGuard в твоём проекте

### 1) Где рендерить host

Самое естественное место — **`src/app/layouts/AdminLayout.tsx`**.

Почему:

- это точно “верх” админки
- он живёт вокруг всех админских страниц/редакторов
- не зависит от конкретной page

То есть прямо так:

```tsx
// AdminLayout.tsx
export function AdminLayout() {
    return (
        <div className="admin-layout">
            {/* ... header/sidebar ... */}
            <main>
                <Outlet /> {/* или твой router outlet */}
            </main>

            <DeletionGuardHost />
        </div>
    );
}
```

`DeletionGuardHost` будет всегда смонтирован, но чаще всего `return null`.

---

## Где хранить стор и компоненты

У тебя уже есть паттерн:

- глобальные стора: `src/shared/state/*`
- глобальные UI оверлеи: `src/shared/ui/*` (есть ThreeDotMenuOverlay, lightbox)

Я бы сделал так, максимально в твоём стиле:

### Вариант A (предпочтительный): shared/state + shared/ui

**Store**

- `src/shared/state/deletionFlow.store.ts`

**UI**

- `src/shared/ui/DeletionGuard/DeletionGuardHost.tsx`
- `src/shared/ui/DeletionGuard/DeletionGuardModal.tsx`
- `src/shared/ui/DeletionGuard/DeletionGuardBanner.tsx`
- `src/shared/ui/DeletionGuard/deletionGuard.types.ts`

Это прямо ложится рядом с:

- `shared/ui/ThreeDotMenu/ThreeDotMenuOverlay.tsx`
- `shared/ui/lightbox/*`

### Вариант B: features/admin (если хочешь “только админка”)

- `src/features/admin/shared/ui/DeletionGuard/*`
- `src/features/admin/shared/state/deletionFlow.store.ts`

Но я бы всё-таки в `shared/` — потому что это **глобальный слой UI**.

---

## Где разместить API вызов preflight

У тебя API по доменам лежит в features:

- blocks/api/blocksApi.ts
- streams/api/streamsApi.ts
- catalogEditor/api

Для delete-preflight это **кросс-доменная штука**, поэтому логичнее:

- `src/features/admin/shared/api/deleteGuardApi.ts`

Или, если хочешь ещё ближе к shared:

- `src/shared/lib/api/deleteGuardApi.ts`

Но по твоей структуре лучше: **`src/features/admin/shared/api/`** (у тебя уже есть `features/admin/shared/transporter/transporter.ts`, т.е. админ-общие вещи есть).

Пример:

- `src/features/admin/shared/api/deleteGuardApi.ts`
- `src/entities/common/` можно положить типы ответа (`DeletePreflightV2`) если хочешь как entity.

---

## Конкретный “пошагово” план с файлами по твоей структуре

### Шаг 1 — добавить host в AdminLayout

- файл: `src/app/layouts/AdminLayout.tsx`
- добавить: `<DeletionGuardHost />`

✅ Результат: инфраструктура готова.

---

### Шаг 2 — создать store

- файл: `src/shared/state/deletionFlow.store.ts`
- экспорт:
    - `useDeletionFlowStore()` (или как у тебя принято)
    - методы: `open/close/revalidate/startFix`

✅ Результат: `open()` можно вызвать откуда угодно.

---

### Шаг 3 — создать Host + UI (пока заглушка)

- `src/shared/ui/DeletionGuard/DeletionGuardHost.tsx`

Логика:

- если `phase==='idle'` → `return null`
- если `phase==='review'` → показывай простое окно (можно пока без портала)
- если `phase==='fixing'` → показывай маленькую плашку

✅ Результат: ты видишь, что оверлей включается/выключается.

> Портал (createPortal) можно добавить позже, но лучше сразу — чтобы это реально было поверх всего.

---

### Шаг 4 — API preflight (frontend)

- `src/features/admin/shared/api/deleteGuardApi.ts`
- `fetchDeletePreflight(target)` → возвращает `DeletePreflightV2`

✅ Результат: store `revalidate()` начинает приносить реальные данные.

---

### Шаг 5 — backend endpoint

- `GET /admin/delete-preflight?kind=artItem&id=...`
- возвращает `DeletePreflightV2`

✅ Результат: модал показывает streams/blocks.

---

### Шаг 6 — интеграция кнопки Delete в CatalogEditor

- где у тебя сейчас “Delete art item” (скорее всего `features/admin/catalogEditor/ui/SingleItemEditor/*`)
- заменить на: `deletionFlow.open({kind:'artItem', id})`

✅ Результат: “Delete” начинает открывать guard.

---

### Шаг 7 — Open & fix → jump в StreamEditor

- в `DeletionGuardModal` на кнопке стрима:
    - `journey.jump(...)` в StreamEditor, с meta `focus`

✅ Результат: клик по стриму реально ведёт к месту фикса.

---

### Шаг 8 — StreamEditor: обработка focus (outbound meta)

- файл: `src/features/admin/streams/streamEditorSession/StreamEditorSession.context.tsx`
- добавить поддержку: “если пришёл meta focus → выделить blockIndex”

✅ Результат: StreamEditor открывается уже “на проблеме”.

---

### Шаг 9 — цикл “вернулся → continue → revalidate”

- `fixing` фаза показывает баннер “Continue deletion”
- “Continue” → `phase='review'` + `revalidate()`

✅ Результат: delete-flow сам себя ведёт, не надо “помнить delete-mode” в Journey.

---

## Ключевой вывод по твоему вопросу “как возвращаться”

Тебе не нужно “восстанавливать контекст” после удаления — потому что:

- редакторы не размонтируются из-за overlay
- а навигация туда-сюда делается твоим Journey, который уже умеет return

А после успешного delete:

- overlay просто закрывается
- а текущий редактор сам обновит список (или ты вручную refresh-нешь catalog list)

---

Если хочешь, я ещё под твою структуру предложу **точные имена экспортов** (в стиле твоих `useUnsavedChangesStore`, `editorSessionsData.store.ts`) и куда лучше положить `DeletePreflightV2` тип — в `entities/common` или `entities/catalog` / `entities/block`.
