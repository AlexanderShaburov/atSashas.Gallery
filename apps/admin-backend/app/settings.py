from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    admin_origin: AnyHttpUrl | None = None
    site_origin: AnyHttpUrl | None = None
    storage_dir: str = "storage"
    upload_media_dir: str = "upload_media"
    admin_token: str | None = None
    json_data: str = "json_data"

    class Config:
        env_prefix = ""
        env_file = ".env"


settings = Settings()
