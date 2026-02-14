"""Session management with single-session enforcement and activity tracking."""
from datetime import datetime, timedelta, timezone
from typing import Optional


class SessionData:
    """Session data with activity tracking."""
    def __init__(self, username: str, session_token: str):
        self.username = username
        self.session_token = session_token
        self.created_at = datetime.now(timezone.utc)
        self.last_activity = datetime.now(timezone.utc)

    def update_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.now(timezone.utc)

    def is_expired(self, activity_timeout_minutes: int) -> bool:
        """Check if session is expired due to inactivity."""
        timeout = timedelta(minutes=activity_timeout_minutes)
        return datetime.now(timezone.utc) - self.last_activity > timeout


class SessionStore:
    """In-memory session store with single-session enforcement."""

    def __init__(self):
        # Map: session_token -> SessionData
        self._sessions: dict[str, SessionData] = {}
        # Map: username -> session_token (enforce single session per user)
        self._user_sessions: dict[str, str] = {}

    def create_session(self, username: str, session_token: str) -> None:
        """Create new session, invalidating any existing session for this user."""
        # If user already has a session, remove it (single session enforcement)
        if username in self._user_sessions:
            old_token = self._user_sessions[username]
            self._sessions.pop(old_token, None)

        # Create new session
        session_data = SessionData(username, session_token)
        self._sessions[session_token] = session_data
        self._user_sessions[username] = session_token

    def get_session(self, session_token: str) -> Optional[SessionData]:
        """Get session by token."""
        return self._sessions.get(session_token)

    def update_activity(self, session_token: str) -> None:
        """Update last activity for session."""
        session = self._sessions.get(session_token)
        if session:
            session.update_activity()

    def remove_session(self, session_token: str) -> None:
        """Remove session."""
        session = self._sessions.get(session_token)
        if session:
            # Remove from both mappings
            self._user_sessions.pop(session.username, None)
            self._sessions.pop(session_token, None)

    def cleanup_expired(self, activity_timeout_minutes: int) -> None:
        """Remove expired sessions."""
        expired_tokens = [
            token for token, session in self._sessions.items()
            if session.is_expired(activity_timeout_minutes)
        ]
        for token in expired_tokens:
            self.remove_session(token)


# Singleton instance
session_store = SessionStore()
