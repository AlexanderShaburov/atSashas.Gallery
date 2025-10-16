Отлично! Давай поднимем «мини-FastAPI: чтение/запись JSON + upload» как отдельный сервис рядом с фронтом. Ниже — минимально-практичный скелет с Docker’ом, CORS и хранением файлов.

# 1) Структура папок

```bash
your-repo/
  admin-frontend/         # твой React/Vite админ (у тебя уже есть)
  admin-backend/          # ← создаём это
    app/
      __init__.py
      main.py
      deps.py
      settings.py
      storage.py
      routers/
        __init__.py
        health.py
        json_kv.py
        upload.py
    storage/
      json/               # сюда будут сохраняться *.json
      uploads/            # сюда — загруженные файлы
    .env.example
    pyproject.toml        # (или requirements.txt — выбери один путь)
    Dockerfile
    README.md
  docker-compose.yml      # общий (если хочешь вместе запускать)
```

# 2) Настройки окружения

`admin-backend/.env.example`

```ini
# Откуда разрешать CORS (фронт-админ)
ADMIN_ORIGIN=http://localhost:5173
SITE_ORIGIN=http://localhost:5174
# Базовый путь хранилища (в контейнере будет /app/storage)
STORAGE_DIR=/app/storage
# Простейшая защита на запись JSON/аплоад (по желанию)
ADMIN_TOKEN=change-me
```

(Скопируй в `.env` и подставь свои значения.)

# 3) pyproject (Poetry) ИЛИ requirements

Вариант с Poetry (рекомендую):

`admin-backend/pyproject.toml`

```toml
[tool.poetry]
name = "admin-backend"
version = "0.1.0"
description = "Mini FastAPI backend: JSON read/write + uploads"
authors = ["you"]

[tool.poetry.dependencies]
python = "^3.10"
fastapi = "^0.115.0"
uvicorn = {extras = ["standard"], version = "^0.30.0"}
python-multipart = "^0.0.9"
pydantic-settings = "^2.3.4"

[tool.poetry.group.dev.dependencies]
httpx = "^0.27.0"

[tool.poetry.scripts]
serve = "uvicorn:main"

[build-system]
requires = ["poetry-core>=1.8.2"]
build-backend = "poetry.core.masonry.api"
```

Если без Poetry — просто `requirements.txt`:

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
pydantic-settings==2.3.4
```

# 4) Код приложения

`app/settings.py`

```python
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List

class Settings(BaseSettings):
    admin_origin: AnyHttpUrl | None = None
    site_origin: AnyHttpUrl | None = None
    storage_dir: str = "./storage"
    admin_token: str | None = None

    class Config:
        env_prefix = ""
        env_file = ".env"

settings = Settings()
```

`app/deps.py`

```python
from fastapi import Depends, Header, HTTPException, status
from .settings import settings

def require_admin_token(x_admin_token: str | None = Header(default=None)):
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
```

`app/storage.py`

```python
from pathlib import Path
from typing import Any
import json
from .settings import settings

BASE = Path(settings.storage_dir).resolve()
JSON_DIR = BASE / "json"
UPLOAD_DIR = BASE / "uploads"
JSON_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def json_path(key: str) -> Path:
    safe = "".join(ch for ch in key if ch.isalnum() or ch in ("-", "_"))
    return JSON_DIR / f"{safe}.json"

def read_json(key: str) -> Any:
    p = json_path(key)
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

def write_json(key: str, data: Any) -> None:
    p = json_path(key)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

`app/routers/health.py`

```python
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
def health():
    return {"status": "ok"}
```

`app/routers/json_kv.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from ..storage import read_json, write_json
from ..deps import require_admin_token

router = APIRouter(prefix="/json", tags=["json"])

class JsonPayload(BaseModel):
    data: Any

@router.get("/{key}")
def get_json(key: str):
    payload = read_json(key)
    if payload is None:
        raise HTTPException(status_code=404, detail="Not found")
    return {"key": key, "data": payload}

@router.put("/{key}", dependencies=[Depends(require_admin_token)])
def put_json(key: str, body: JsonPayload):
    write_json(key, body.data)
    return {"ok": True, "key": key}
```

`app/routers/upload.py`

```python
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import hashlib
import shutil
from ..settings import settings
from ..deps import require_admin_token
from ..storage import UPLOAD_DIR

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_MIME = {
    "image/png", "image/jpeg", "image/webp", "image/avif",
    "application/pdf", "image/svg+xml"
}
MAX_BYTES = 50 * 1024 * 1024  # 50 MB

def _digest(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

@router.post("", dependencies=[Depends(require_admin_token)])
async def upload(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported type: {file.content_type}")

    # временный путь
    tmp = UPLOAD_DIR / f"._tmp_{file.filename}"
    total = 0
    with tmp.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_BYTES:
                tmp.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    # финальное имя — по хэшу (чтобы избежать дублей)
    sha = _digest(tmp)
    ext = Path(file.filename).suffix.lower()
    final = UPLOAD_DIR / f"{sha}{ext}"
    if not final.exists():
        shutil.move(tmp, final)
    else:
        tmp.unlink(missing_ok=True)

    # относительный путь для фронта
    rel = f"/files/uploads/{final.name}"
    return {"ok": True, "bytes": total, "sha256": sha, "path": rel, "type": file.content_type}
# Here!!!!!
@router.get("/by-name/{name}")
def get_uploaded_by_name(name: str):
    p = UPLOAD_DIR / name
    if not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p)
```

`app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .settings import settings
from .routers import health, json_kv, upload

app = FastAPI(title="Admin Mini API")

origins = []
if settings.admin_origin: origins.append(str(settings.admin_origin))
if settings.site_origin:  origins.append(str(settings.site_origin))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],  # на проде лучше явно перечислить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статика для скачивания файлов
BASE = Path(settings.storage_dir)
FILES_DIR = BASE  # включает /json и /uploads
app.mount("/files", StaticFiles(directory=str(FILES_DIR), html=False), name="files")

# Роутеры
app.include_router(health.router)
app.include_router(json_kv.router)
app.include_router(upload.router)
```

# 5) Dockerfile

`admin-backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Если используешь Poetry
RUN pip install --no-cache-dir poetry==1.8.3
COPY pyproject.toml poetry.lock* /app/
RUN poetry config virtualenvs.create false \
 && poetry install --no-interaction --no-ansi

# Если вместо Poetry — requirements.txt, то:
# COPY requirements.txt /app/
# RUN pip install --no-cache-dir -r requirements.txt

COPY app /app/app
COPY .env /app/.env  # при деплое можешь монтировать вместо копирования
RUN mkdir -p /app/storage/json /app/storage/uploads

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host=0.0.0.0", "--port=8000"]
```

# 6) docker-compose (фрагмент)

В корне твоего репо `docker-compose.yml` добавь сервис:

```yaml
services:
  admin-backend:
    build:
      context: ./admin-backend
    container_name: admin-backend
    env_file:
      - ./admin-backend/.env
    volumes:
      - ./admin-backend/storage:/app/storage
      # если хочешь править код без ребилда:
      # - ./admin-backend/app:/app/app:ro
    ports:
      - "8000:8000"
    restart: unless-stopped
```

(Если у тебя есть Caddy/Nginx — проксируй `admin.yourdomain/api` → `admin-backend:8000`.)

# 7) Локальный запуск без Docker (на выбор)

```bash
cd admin-backend
cp .env.example .env
# Poetry:
poetry install
poetry run uvicorn app.main:app --reload
# или pip:
# python -m venv .venv && source .venv/bin/activate
# pip install -r requirements.txt
# uvicorn app.main:app --reload
```

# 8) Проверка эндпоинтов

* Здоровье: `GET http://localhost:8000/health` → `{"status":"ok"}`
* Чтение JSON: `GET /json/gallery`
* Запись JSON (нужен заголовок `X-Admin-Token`):

  ```
  PUT /json/gallery
  Headers: X-Admin-Token: <ADMIN_TOKEN из .env>
  Body (JSON):
  { "data": { "items": [ { "id":"m01", "title":"Mixed 01" } ] } }
  ```

  Файл сохранится как `storage/json/gallery.json`.
* Загрузка файла (тоже с токеном):

  ```
  POST /upload
  form-data: file=<выбери файл>
  ```

  Ответ вернёт `path`, например `/files/uploads/<sha>.png`.
  Эту ссылку можно отдавать фронту админки.

# 9) Как подключить к твоей админке (Vite)

В твоём админ-фронте добавь базовый клиент:

```ts
// api.ts
const API = import.meta.env.VITE_ADMIN_API ?? "http://localhost:8000";
const TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "";

export async function getJson(key: string) {
  const res = await fetch(`${API}/json/${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function putJson(key: string, data: unknown) {
  const res = await fetch(`${API}/json/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { "X-Admin-Token": TOKEN } : {}),
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { ...(TOKEN ? { "X-Admin-Token": TOKEN } : {}) },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

И в `.env` фронта:

```
VITE_ADMIN_API=http://localhost:8000
VITE_ADMIN_TOKEN=change-me
```

# 10) Куда что складывается

* JSON-состояния: `admin-backend/storage/json/<key>.json`
* Загруженные файлы: `admin-backend/storage/uploads/<sha>.<ext>`
* Раздача статики: `GET /files/...` (монтирование всего `storage` под `/files`)

# 11) Мини-безопасность (по желанию, сразу готово)

* Любые записи/аплоады требуют `X-Admin-Token`.
* CORS ограничен значениями `ADMIN_ORIGIN` и `SITE_ORIGIN`.
* Лимит размера файла 50 MB и белый список MIME.

---

Хочешь — сразу сгенерю тебе готовые файлы (теми же именами), чтобы ты просто вставил в репозиторий. Или если удобнее, добавлю Caddy-правила под твой домен (`admin.<домен>/api → admin-backend:8000`).
