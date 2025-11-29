from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers.hopper import hopper, upload

from .routers.art import catalog
from .settings import settings
from .routers import health, json_kv
from .storage import BASE

#   -----------------------
#   LOGGER SETTING
#   -----------------------


logging.basicConfig(
    level=logging.INFO,
    format="\033[35mMY_LOG.\033[0mMY_LOG: %(asctime)s - \033[33m%(name)s\033[0m - %(levelname)s - %(message)s",
)

#   logging console out
handler = logging.StreamHandler()


logger = logging.getLogger(__name__)
#   -----------------------
#   END OF LOGGER SETTINGS
#   -----------------------


app = FastAPI(title="Admin Mini API")

origins = []
if settings.admin_origin:
    origins.append(str(settings.admin_origin))
if settings.site_origin:
    origins.append(str(settings.site_origin))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],  # List explicitly on prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Files download static:
FILES_DIR = BASE  # Includes /json and /uploads
logger.info(f"FILES_DIR from the main.py {FILES_DIR}")
logger.info(f"settings.storage_root: {settings.storage_root}")
logger.info(f"settings.upload_media_dir {settings.upload_media_dir}")
logger.info(f"settings.json_data {settings.json_data}")
app.mount(
    "/files", StaticFiles(directory=str(FILES_DIR), html=False), name="files"
)

# Routers
app.include_router(health.router)
app.include_router(json_kv.router)
app.include_router(upload.router)
app.include_router(hopper.router)
app.include_router(catalog.router)
