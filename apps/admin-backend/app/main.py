from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers.hopper import hopper, upload

from app.routers.art import catalog
from app.routers.auth import auth
from app.routers.block import blocks, public_blocks
from app.routers.streams import streams
from app.routers.enrollments import enrollments
from app.routers.events import events
from app.routers.public_stream import public_stream
from app.routers.home_doc import home_doc
from app.routers.text_visuals import text_visuals
from app.routers.media_items import media_items
from app.settings import settings
from app.routers import health, json_kv
from app.storage import BASE

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
app.include_router(auth.router)  # Auth endpoints (login/logout)
app.include_router(json_kv.router)
app.include_router(upload.router)
app.include_router(hopper.router)
app.include_router(catalog.router)
app.include_router(blocks.router)
app.include_router(public_blocks.public_router)  # Public blocks endpoint
app.include_router(streams.public_router)  # Public streams endpoint
app.include_router(streams.router)  # Admin streams endpoints
app.include_router(public_stream.public_router)  # Public endpoint
app.include_router(public_stream.admin_router)  # Admin endpoints
app.include_router(events.public_router)  # Public events endpoint
app.include_router(events.admin_router)  # Admin events endpoints
app.include_router(enrollments.public_router)  # Public enrollment + Stripe webhook
app.include_router(enrollments.admin_router)  # Admin enrollment list
app.include_router(home_doc.public_router)  # Public home doc endpoint
app.include_router(home_doc.admin_router)  # Admin home doc endpoints
app.include_router(text_visuals.public_router)  # Public text visuals endpoint
app.include_router(text_visuals.admin_router)  # Admin text visuals endpoints
app.include_router(media_items.public_router)  # Public media items endpoint
app.include_router(media_items.admin_router)  # Admin media items endpoints
