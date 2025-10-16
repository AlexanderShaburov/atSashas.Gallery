```bash

PROJECTS/
    └── SASHA/
        └──SashaGallery/
            ┣ apps/
            ┃ ┣ backend-admin/
            ┃ ┗ frontend/
            ┣ docker/
            ┃ ┣ .env
            ┃ ┣ Caddyfile.dev
            ┃ ┗ docker-compose.yml
            ┣ packages/
            ┗ vault/
                ┣ streams/
                ┃   └─streams.json
                ┗ vaultOfArts/
                  ┣ mixed/          #Temporary -> to be deleted
                  ┣ fullSizes/
                  ┣ Previews/
                  ┣ watercolor/     #Temporary -> to be deleted
                  ┗ catalog.json

```

Agreement:

Понял — идём строго «базой» и короткими шагами. Ни кода, ни .env пока не трогаем. Вот что зафиксируем сейчас на 100% по **структуре каталогов** и **ролям**.

# Шаг 1. Что считаем «истиной» по дереву

Твоё текущее дерево (сокращаю до важного):

```bash
SashaGallery/
├─ apps/
│  ├─ admin-backend/
│  └─ frontend/
├─ docker/
│  ├─ .env
│  ├─ Caddyfile.dev
│  └─ docker-compose.yml
└─ vault/
    ├─ arts/
    │  ├─ fullsize/
    │  ├─ previews/
    │  ├─ mixed/
    │  ├─ watercolor/
    │  └─ catalog.json
    └─ streams/
        └─ streams.json   ← здесь все заметки/комменты
```

**Фиксируем базовые принципы:**

1. **`docker-compose.yml` живёт в `SashaGallery/docker/`.**
2. **Единое хранилище для данных — `SashaGallery/vault/`.** В локалке _не уезжаем_ наружу, позже на сервере можно будет примонтировать внешний путь.
3. **Бэкенд и прокси будут видеть `vault/` одинаково** (один и тот же mount).
4. **Фронтенд** ничего не пишет прямо в `vault/`, только читает (через HTTP) и пользуется API бэкенда для записи.

# Шаг 2. Приводим названия к единому стилю (только про имена)

Чтобы дальше не путаться, договоримся о **строгих именах папок** (только структура, без логики):

- Внутри `vault/arts/`:
  - `fullsize/` ← было `fullSize/`
  - `previews/`
  - `mixed/`
  - `watercolor/`
  - `catalog.json` ← было `vaultCatalog.json`

- Внутри `vault/letters/`:
  - `catalog.json` ← было `textCatalog.json` (если это общий каталог раздела писем)

- Внутри `vault/streams/`:
  - `streams.json` (оставляем как есть)

Итого целевое дерево **после переименований**:

```
vault/
├─ arts/
│  ├─ fullsize/
│  ├─ previews/
│  ├─ mixed/
│  ├─ watercolor/
│  └─ catalog.json
├─ letters/
│  └─ catalog.json
└─ streams/
   └─ streams.json
```

> Почему так: всё **lowercase**, без CamelCase, названия максимально очевидные; `catalog.json` унифицировано по всем разделам.

**Что сделать прямо сейчас (локально):**

- Переименовать `fullSize` → `fullsize`
- Проверить регистр у `previews`, `mixed`, `watercolor` (если вдруг есть заглавные — в нижний)
- Переименовать `vaultCatalog.json` → `catalog.json`
- (Опционально) `letters/textCatalog.json` → `letters/catalog.json`, если это действительно каталог раздела.

# Шаг 3. Роли каталогов (без кода)

- `vault/arts/fullsize/` — хранение полноразмеров.
- `vault/arts/previews/` — превью/оптимизированные копии.
- `vault/arts/mixed/`, `vault/arts/watercolor/` — если это **рабочие** папки с исходниками — отмечаем как «временные» и позднее вычистим (или перенаправим потоки так, чтобы всё стекалось в `fullsize`/`previews`). Если это **логические коллекции** — оставляем и договоримся о схеме имен в каталоге.
- `vault/arts/catalog.json` — главный каталог для раздела **arts** (описывает серии/работы/пути к изображениям).
- `vault/letters/catalog.json` — главный каталог для раздела **letters**.
- `vault/streams/streams.json` — каталог для раздела **streams**.

Важно: **никаких служебных `storage/` внутри `apps/admin-backend/` больше не используем** как место истины. Всё — в `vault/`.

# Шаг 4. Мини-договорённость об адресации (без URL и .env)

Пока просто формула **относительных путей внутри `vault/`** (без привязки к доменам/прокси):

- Картинки: `arts/fullsize/<имя>` и `arts/previews/<имя>`
- Каталоги: `arts/catalog.json`, `letters/catalog.json`, `streams/streams.json`

Фронтенд будет читать **каталоги** и получать оттуда относительные пути к картинкам. Бэкенд при записи будет складывать файлы именно сюда.

---

Если ок с этими **четырьмя шагами**, на следующем шаге аккуратно:

- привяжем `vault/` к сервисам в `docker/docker-compose.yml` **только через volumes** (без остального шума),
- и договоримся про простейшее правило URL (кто раздаёт статику — прокси или бэк), снова без кода — только про «как выглядит путь».
