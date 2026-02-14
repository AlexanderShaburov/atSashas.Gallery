"""Pydantic schemas for authentication requests/responses."""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Login request payload."""
    username: str
    password: str


class UserInfo(BaseModel):
    """User information response (no password)."""
    username: str
    full_name: str
    is_active: bool


class LoginResponse(BaseModel):
    """Login response with user info."""
    user: UserInfo
    message: str = "Login successful"
