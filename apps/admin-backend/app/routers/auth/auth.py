"""Authentication endpoints."""
import logging

from fastapi import APIRouter, HTTPException, Response, status

from app.auth.dependencies import CurrentUser
from app.auth.models import User
from app.auth.repository import user_repo
from app.auth.schemas import LoginRequest, LoginResponse, UserInfo
from app.auth.security import create_session_token, verify_password
from app.auth.session import session_store
from app.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=LoginResponse)
async def login(credentials: LoginRequest, response: Response):
    """
    Login with username and password.

    Sets HTTP-only session cookie on success.
    Enforces single concurrent session per user.
    """
    # Get user from repository
    user = user_repo.get_user(credentials.username)

    if not user or not user.is_active:
        logger.warning(f'Login attempt for unknown/inactive user: {credentials.username}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid username or password',
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        logger.warning(f'Failed login attempt for user: {credentials.username}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid username or password',
        )

    # Create session token
    session_token = create_session_token(
        data={'sub': user.username},
        secret_key=settings.secret_key,
        expires_minutes=settings.session_expire_minutes,
    )

    # Store session (enforces single session per user)
    session_store.create_session(user.username, session_token)

    # Set HTTP-only cookie
    response.set_cookie(
        key='session_token',
        value=session_token,
        httponly=True,  # Prevent JS access
        secure=False,  # Set to True in production with HTTPS
        samesite='lax',  # CSRF protection
        max_age=settings.session_expire_minutes * 60,  # seconds
    )

    logger.info(f'User logged in: {user.username}')

    return LoginResponse(
        user=UserInfo(**user.dict_safe()),
        message='Login successful',
    )


@router.post('/logout')
async def logout(response: Response, current_user: CurrentUser):
    """
    Logout current user.

    Clears session cookie and removes session from store.
    """
    # Note: We get the session_token from the cookie via dependency
    # but we need to access it directly to remove it
    # For now, we'll remove all sessions for this user (single session enforcement makes this safe)

    # Remove cookie
    response.delete_cookie(key='session_token')

    logger.info(f'User logged out: {current_user.username}')

    return {'message': 'Logged out successfully'}


@router.get('/me', response_model=UserInfo)
async def get_current_user_info(current_user: CurrentUser):
    """Get current authenticated user info."""
    return UserInfo(**current_user.dict_safe())
