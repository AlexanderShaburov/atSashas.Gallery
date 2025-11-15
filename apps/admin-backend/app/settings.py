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

    class Config:
        env_prefix = ""
        env_file = ".env"


settings = Settings()
