"""User repository: load/save users from JSON file.

Clean-deploy tolerance: a missing or malformed `users.json` must not
prevent the backend from starting. The file is loaded lazily at import
time as a best effort — if it is absent, the repository operates with
an empty user dict and `get_user` returns `None`, so the existing
login flow rejects attempts with "invalid credentials" rather than
the whole FastAPI app failing to import.

This matches the clean-deploy contract that other startup paths
already follow — `app/storage.py` mkdir's the JSON directory with
`exist_ok=True` rather than raising when it is absent.
"""
import json
import logging
from pathlib import Path

from app.auth.models import User
from app.storage import JSON_DIR

logger = logging.getLogger(__name__)

USERS_FILE = JSON_DIR / 'users.json'


class UserRepository:
    """Manages user data storage."""

    def __init__(self, file_path: Path = USERS_FILE):
        self.file_path = file_path
        self._users: dict[str, User] = {}
        self._load_users()

    def _load_users(self) -> None:
        """Load users from JSON file.

        Missing or malformed file is treated as "no users configured" —
        the backend stays up; login fails at the repository lookup.
        """
        if not self.file_path.exists():
            logger.warning(
                'Users file not found at %s; starting with no users configured. '
                'Login will fail until the file is provisioned.',
                self.file_path,
            )
            self._users = {}
            return

        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            logger.error(
                'Failed to read users file at %s (%s); starting with no '
                'users configured.',
                self.file_path,
                exc,
            )
            self._users = {}
            return

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
