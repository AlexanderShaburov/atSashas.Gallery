"""User data models."""
from pydantic import BaseModel


class User(BaseModel):
    """User model."""
    username: str
    hashed_password: str
    full_name: str
    is_active: bool = True

    def dict_safe(self) -> dict:
        """Return user dict without password."""
        return {
            'username': self.username,
            'full_name': self.full_name,
            'is_active': self.is_active,
        }
