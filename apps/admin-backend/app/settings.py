from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    admin_origin: AnyHttpUrl | None = None
    site_origin: AnyHttpUrl | None = None
    storage_root: str = "/media"
    upload_media_dir: str = "/hopper"
    media_dir: str = "/arts"
    full_size: str = "/fullsize"
    previews: str = "/previews"
    admin_token: str | None = None
    json_data: str = "/json"
    blocks: str = "/block_collection"
    catalog_file: str = "art_catalog.json"

    # Authentication settings
    secret_key: str = "CHANGE_THIS_IN_PRODUCTION_TO_RANDOM_SECRET"
    session_expire_minutes: int = 240  # 4 hours
    activity_timeout_minutes: int = 30  # 30 minutes of inactivity

    class Config:
        env_prefix = ""
        env_file = ".env"


settings = Settings()
