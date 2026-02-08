Ок, вот тебе **короткий пошаговый план**, чтобы потом вернуться и добить delete “как по рельсам”. Я сделаю в том порядке, чтобы ты мог брать по одному пункту и закрывать.

## Чеклист внедрения DeleteGuard Overlay

### 1) Точка встраивания в UI (1 файл)

- В админском “верхнем” компоненте, где живёт роутер (типа `AdminShell` / `AdminLayout`), добавь рядом с роутером:
    - `<DeletionGuardHost />`

- Он должен быть **всегда смонтирован**, но возвращать `null`, когда нет активного процесса.

Готовность: “в приложении появился пустой хост, ничего не ломает”.

---

### 2) Внешний стор delete-flow (1 файл)

Сделай минимальный стор:

Состояние:

- `phase: 'idle' | 'review' | 'fixing' | 'ready' | 'deleting'`
- `target?: { kind: 'artItem' | 'block'; id: string }`
- `preflight?: DeletePreflightV2`
- `error?: string`

Методы:

- `open(target)` → phase='review', target=..., preflight=undefined
- `close()` → phase='idle'
- `revalidate()` → дергает preflight endpoint и кладёт в `preflight`
- `startFix()` → phase='fixing' (и можно “minimize” UI)
- `confirmDelete()` → дергает delete endpoint, потом close()

Готовность: “из любого места можно вызвать `deletionFlow.open()`”.

---

### 3) Компонент Overlay UI (2 режима)

`DeletionGuardHost` читает стор и рендерит:

- `phase === 'review' || phase === 'ready'` → **Modal**
    - показывает список `streams` (и `blocks`, если ты делаешь V2)
    - кнопки:
        - **Open & fix** (на стрим)
        - **Continue later** (переводит в fixing + закрывает модал)
        - **Cancel** (close)
        - **Delete now** (только когда policy.canDeleteSafely)

- `phase === 'fixing'` → **мини-плашка/баннер**
    - текст: “Deletion in progress: artItem #…”
    - кнопка **Continue** → открывает модал (phase='review' + revalidate)

Готовность: “нажал delete → увидел окно; нажал continue later → появилась плашка”.

---

### 4) API: preflight endpoint (backend)

Сделай ручку:

- `GET /admin/delete-preflight?kind=artItem&id=...`
- (позже) `GET ...?kind=block&id=...`

Возвращает `DeletePreflightV2` (streams + blocks + summary + policy).

Готовность: “модал показывает реальные данные”.

---

### 5) API: delete endpoint (backend) — пока stub/guarded

Сделай:

- `DELETE /admin/art-items/{id}` (или как у тебя принято)
  Логика v1:
- если preflight показывает зависимости в стримах → 409 Conflict (или 400) + сообщение “dependencies exist”
- если нет → удаляешь

Готовность: “без фикса не даст удалить”.

---

### 6) Интеграция кнопок Delete в UI (catalog + block)

В местах где сейчас Delete:

- заменить прямой delete на:
    - `deletionFlow.open({ kind:'artItem', id })`
    - (для блока) `open({ kind:'block', id })`

Готовность: “везде Delete ведёт в один и тот же процесс”.

---

### 7) Journey: открыть StreamEditor с фокусом (outbound)

Добавь в StreamEditor обработку inbound/outbound “focus payload”:

В адресе/тикете (meta) передавай:

- `focus: { streamBlockIndex, blockId? }`
- `reason: 'deleteGuard'`
- `target: { kind, id }` (опционально)

StreamEditor при открытии:

- выделяет нужный блок
- даёт кнопки “Remove block from stream” / “Edit block”

Готовность: “из модала клик → StreamEditor открылся на нужном месте”.

---

### 8) Возврат из Journey и “как понять что мы в delete-mode”

Ничего специально понимать не надо.

Правило:

- delete-mode живёт в `deletionFlowStore`
- после возвращения пользователь сам нажимает “Continue” в мини-плашке
- либо ты можешь автоматически revalidate, но это необязательно для v1

Готовность: “вернулся → продолжаю удаление без магии”.

---

## Самый короткий “MVP порядок”, если хочешь сделать за минимум шагов

1. Host в AdminShell
2. Store (idle/review)
3. Простая Modal (без баннера)
4. Preflight endpoint artItem
5. Delete кнопка вызывает `open()`
6. Open&fix делает jump в StreamEditor (focus)
7. Continue → revalidate → delete

Баннер/minimize можно добавить позже, это косметика.

---

Если тебе удобно, я могу ещё дать “готовые названия файлов/папок” под твою структуру `apps/frontend/src/features/admin/...` и очень короткие сигнатуры типов, чтобы ты не думал “как обозвать”.
