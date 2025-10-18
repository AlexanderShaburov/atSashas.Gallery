# atSashas.Gallery — блог за 17 октября и обновлённый Project Context

> Дата: 18 октября 2025 (сводка за 17 октября)

---

## 1) Блог: что сделали вчера

### Сделано

* **Запустили локальную дев-среду в виде 3 контейнеров**: `frontend`, `admin-backend`, `caddy` (реверс‑прокси) — проект теперь можно крутить без постоянных перебилдов образов, используя **bind‑mountы**.
* **Подготовили заглушки для ручек в админ-бэкенде** (эндпойнты под будущие сущности; используются для быстрой интеграции фронта).
* **Синхронизировали общую директорию** (shared каталог) между контейнерами для моментального отображения правок.
* **Поставили фронтовые дев-зависимости**: `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `typescript`, `@types/react`, `@types/react-dom`.

### Замеченные проблемы (в процессе)

* **Vite dev server не стартует**: в логах `frontend` видно `Cannot find package '@vitejs/plugin-react'` и временный путь `.vite-temp/vite.config.ts.timestamp-...`. Надо проверить **установку плагина** и **пути/типы `vite.config.ts`**.
* **Volume для node_modules**: ошибка `service "frontend" refers to undefined volume node_modules_frontend`. В `docker-compose.yml` объявлен том в сервисе, но нет декларации в разделе `volumes:`. Надо добавить явное определение.
* **CSS в админке** (`src/features/admin/pages/adminIndex.css`):

  * незаполненный `border-radius:`,
  * оборванное свойство `transition: transform: 120ms ease, ...`,
  * артефакт `center;` и сообщение линтера про `semicolon expected`. Требуется привести файл к валидному синтаксису и к нашей глобальной карте переменных.
* **Маршрутизация фронта**: была ошибка `Not Found` при переходах — проверить конфиг Caddy (SPA fallback на `index.html`) и маршруты Vite dev-сервера.

### Коротко: статус дня

* Инфраструктура с докером — **есть**.
* Быстрый цикл правок через bind‑mount — **есть**.
* Заглушки API — **есть**.
* Фронт билд/дев‑сервер — **требует фикса** (плагины, volumes, конфиги).
* UI‑мелочи (CSS, маршруты) — **в работе**.

---

## 2) Обновлённый Project Context

### 2.1. Цель

Быстрый итеративный цикл разработки галереи/админки без постоянных перебилдов образов, с единой докер‑оркестрацией и «горячими» правками через bind‑mount.

### 2.2. Текущая архитектура

* **Caddy (reverse proxy)**

  * Терминирует HTTP, проксирует на `frontend` и `admin-backend`.
  * Должен иметь SPA‑fallback для фронта (`try_files /index.html`).
* **Frontend (Vite + React + TS)**

  * Запуск дев‑сервера через `vite` в контейнере.
  * `node_modules` внутри контейнера (том), исходники — bind‑mount.
* **Admin‑backend**

  * Временно — набор заглушек REST (mock), отдаёт фиктивные данные под будущие схемы.

### 2.3. Файловая структура (актуальная)

```
project-root/
  docker-compose.yml
  caddy/
    Caddyfile
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    src/
      features/admin/pages/adminIndex.css
      ...
  admin-backend/
    src/
      routes/ (заглушки)
    package.json (если Node) / pyproject.toml (если Python) — зависит от реализации
```

### 2.4. Docker Compose — ключевые моменты

* Для `frontend`:

  * **volumes**:

    * bind‑mount `./frontend:/app` (исходники),
    * **named volume** `node_modules_frontend:/app/node_modules` (чтобы не пересекаться с хостом).
  * **command**: `npm run dev -- --host 0.0.0.0` (или эквивалент).
* Для `admin-backend`:

  * bind‑mount исходников,
  * команда запуска mock‑серверa.
* В корне `docker-compose.yml` **обязательно**:

  ```yaml
  volumes:
    node_modules_frontend:
  ```

### 2.5. Vite/React — базовые настройки

* `vite.config.ts`:

  * подключить `@vitejs/plugin-react`;
  * учесть `vite-tsconfig-paths` (если используем алиасы);
  * dev server слушает `0.0.0.0`.
* `package.json` (frontend):

  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "preview": "vite preview --host"
    },
    "devDependencies": {
      "vite": "^7.x",
      "@vitejs/plugin-react": "^4.x",
      "vite-tsconfig-paths": "^5.x",
      "typescript": "^5.x",
      "@types/react": "^18.x",
      "@types/react-dom": "^18.x"
    }
  }
  ```

### 2.6. CSS: приведение к «глобальной карте»

Пример исправленного блока (адаптировать под ваши CSS‑переменные):

```css
/* src/features/admin/pages/adminIndex.css */
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --radius-lg: 12px;
  --text-muted: #666;
  --tile-bg: #fff;
  --tile-border: rgba(0,0,0,0.06);
  --tile-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.admin-index {
  padding: var(--space-4);
  display: grid;
  gap: var(--space-4);
}

.admin-index__header {
  display: grid;
  gap: var(--space-1);
}

.admin-index__subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.admin-index__grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 720px) {
  .admin-index__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.admin-index__tile {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--tile-bg);
  box-shadow: var(--tile-shadow);
  border: 1px solid var(--tile-border);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.admin-index__tile:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
```

### 2.7. Чек-лист «собрать и поехать»

1. **Плагины Vite**: убедиться, что `@vitejs/plugin-react` реально в `devDependencies` и попадает в образ/контейнер.
2. **node_modules volume**: добавить `volumes: node_modules_frontend:` в корне compose.
3. **Vite dev server**: `vite.config.ts` экспортирует конфиг по умолчанию, без побочных эффектов. Проверить `import` путей.
4. **Caddy SPA fallback**: включить `try_files {path} /index.html` (или аналог) для роутинга React.
5. **CSS**: поправить синтаксис и подключение глобальных переменных.
6. **Порты**: пробросить порт фронта (напр., `5173`) и бэкенда.

### 2.8. Диагностика типичных ошибок

* **`Cannot find package '@vitejs/plugin-react'`** — пакет не установлен в контейнере. Запустить `npm ci` **внутри** контейнера или убедиться, что `node_modules` не перетирается пустой директорией с хоста (поэтому и используем named volume).
* **`undefined volume node_modules_frontend`** — забыли объявить том в корневом `volumes:` Compose.
* **`Not Found` при навигации** — нет SPA‑fallback в Caddy или Vite, либо неправильный base-path в Vite (`base: '/'`).

### 2.9. Команды

```bash
# первый запуск
docker compose up -d --build

# логи фронта
docker logs -f docker-frontend-1

# установка зависимостей внутри контейнера фронта (если нужно)
docker compose run --rm frontend sh -lc "npm ci"
```

### 2.10. Ближайшие шаги (предлагаю)

* [ ] Дописать `volumes:` в `docker-compose.yml` и перезапустить.
* [ ] Пересобрать/переустановить дев-зависимости фронта в контейнере (`npm ci`).
* [ ] Упростить `vite.config.ts` до минимального, добавить только `@vitejs/plugin-react` и `server.host = true`.
* [ ] Привести CSS админки по шаблону выше.
* [ ] Проверить Caddyfile на SPA‑fallback.
* [ ] Проткнуть простой e2e: страница админки рендерится, запрос к mock‑ручке отвечает.

---

## 3) Краткий changelog (17.10)

* Docker‑оркестрация: базовая тройка сервисов готова.
* Добавлены мок‑ручки в админ‑бэкенде.
* Настроен bind‑mount исходников для «горячих» правок.
* Установлены Vite/React/TS зависимости (нужна доводка плагинов).
* Зафиксированы проблемы с volumes, Vite и CSS — вынесены в чек‑лист.

---

Если что-то из статусов выше не совпадает с вашей локальной картиной — помечу в следующем апдейте. Этот контекст можно держать как «живой» документ и обновлять по мере закрытия пунктов.
