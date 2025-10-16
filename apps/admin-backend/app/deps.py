from fastapi import Header, HTTPException, status
from .settings import settings

def require_admin_token(x_admin_token: str | None =
                        Header(default=None)):
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token"
                            )
