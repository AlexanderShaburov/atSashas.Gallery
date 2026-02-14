"""FastAPI dependencies for authentication."""
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.auth.models import User
from app.auth.repository import user_repo
from app.auth.security import decode_session_token
from app.auth.session import session_store
from app.settings import settings


async def get_current_user(
    session_token: Annotated[str | None, Cookie(alias='session_token')] = None,
) -> User:
    """
    Dependency to get current authenticated user from session cookie.

    Raises 401 if not authenticated or session invalid/expired.
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Not authenticated',
        )

    # Check if session exists in session store
    session_data = session_store.get_session(session_token)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired session',
        )

    # Check activity timeout
    if session_data.is_expired(settings.activity_timeout_minutes):
        session_store.remove_session(session_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Session expired due to inactivity',
        )

    # Verify token signature
    payload = decode_session_token(session_token, settings.secret_key)
    if not payload:
        session_store.remove_session(session_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid session token',
        )

    username: str | None = payload.get('sub')
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token payload',
        )

    # Get user from repository
    user = user_repo.get_user(username)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not found or inactive',
        )

    # Update activity timestamp
    session_store.update_activity(session_token)

    return user


# Type alias for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
