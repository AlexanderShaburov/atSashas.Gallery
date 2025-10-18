from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    admin_origin: AnyHttpUrl | None = None
    site_origin: AnyHttpUrl | None = None
    storage_dir: str = "/hopper"
    admin_token: str | None = None

    class Config:
        env_prefix = ""
        ent_file = ".env"


settings = Settings()
