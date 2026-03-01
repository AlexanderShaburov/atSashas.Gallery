"""User repository: load/save users from JSON file."""
import json
from pathlib import Path

from app.auth.models import User
from app.storage import JSON_DIR

USERS_FILE = JSON_DIR / 'users.json'


class UserRepository:
    """Manages user data storage."""

    def __init__(self, file_path: Path = USERS_FILE):
        self.file_path = file_path
        self._users: dict[str, User] = {}
        self._load_users()

    def _load_users(self) -> None:
        """Load users from JSON file."""
        if not self.file_path.exists():
            raise FileNotFoundError(f'Users file not found: {self.file_path}')

        with open(self.file_path, 'r') as f:
            data = json.load(f)

        self._users = {
            user_data['username']: User(**user_data)
            for user_data in data.get('users', [])
        }

    def get_user(self, username: str) -> User | None:
        """Get user by username."""
        return self._users.get(username)

    def get_all_users(self) -> list[User]:
        """Get all users."""
        return list(self._users.values())


# Singleton instance
user_repo = UserRepository()
