"""Unit tests for JWT token utilities and password hashing."""

import pytest

from app.auth.security import (
    create_session_token,
    decode_session_token,
    get_password_hash,
    verify_password,
)


# ---------------------------------------------------------------------------
# Password hashing (requires passlib + bcrypt backend to be functional)
# ---------------------------------------------------------------------------

def _bcrypt_available() -> bool:
    """Check if passlib can actually use its bcrypt backend."""
    try:
        get_password_hash("probe")
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _bcrypt_available(), reason="passlib bcrypt backend unavailable")
def test_password_hash_and_verify():
    hashed = get_password_hash("correct-horse-battery-staple")
    assert verify_password("correct-horse-battery-staple", hashed)


@pytest.mark.skipif(not _bcrypt_available(), reason="passlib bcrypt backend unavailable")
def test_password_verify_rejects_wrong():
    hashed = get_password_hash("right")
    assert not verify_password("wrong", hashed)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

def test_jwt_roundtrip():
    secret = "test-secret-key"
    token = create_session_token({"sub": "alice"}, secret, expires_minutes=30)
    payload = decode_session_token(token, secret)
    assert payload is not None
    assert payload["sub"] == "alice"
    assert "exp" in payload


def test_jwt_decode_bad_secret():
    token = create_session_token({"sub": "alice"}, "key-a", expires_minutes=30)
    result = decode_session_token(token, "key-b")
    assert result is None


def test_jwt_preserves_custom_claims():
    claims = {"sub": "bob", "role": "admin", "org": "gallery"}
    token = create_session_token(claims, "s3cret", expires_minutes=60)
    payload = decode_session_token(token, "s3cret")
    assert payload is not None
    assert payload["sub"] == "bob"
    assert payload["role"] == "admin"
    assert payload["org"] == "gallery"
