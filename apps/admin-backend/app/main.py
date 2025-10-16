from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .settings import settings
from .routers import health, json_kv, upload

app = FastAPI(title="Admin Mini API")

origins = []
if settings.admin_origin: 
    origins.append(str(settings.admin_origin))
if settings.site_origin: 
    origins.append(str(settings.site_origin))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"], # List explicitly on prod 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Files download static:
BASE = Path(settings.storage_dir)
FILES_DIR = BASE  # Includes /json and /uploads
app.mount("/files", StaticFiles(directory=str(FILES_DIR), html=False), name="files")

# Routers
app.include_router(health.router)
app.include_router(json_kv.router)
app.include_router(upload.router)
