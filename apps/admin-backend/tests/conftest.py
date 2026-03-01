"""
Test configuration and fixtures for SashaGallery backend.

IMPORTANT: The STORAGE_ROOT env var and seed files are set up at module level,
BEFORE any app module is imported, so that pydantic-settings and all module-
level singletons (settings, storage paths, UserRepository) resolve to the
temporary vault.
"""

import json
import os
import shutil
import tempfile

import pytest

# ---------------------------------------------------------------------------
# 1. Create isolated vault and seed essential files BEFORE any app import.
#
#    Order matters:
#      a) Create temp dir and set env var
#      b) Create directory structure (storage.py also creates dirs, but
#         UserRepository needs users.json to exist at import time)
#      c) Write users.json (loaded by UserRepository singleton on import)
#      d) Import app modules
# ---------------------------------------------------------------------------

_TEST_VAULT = tempfile.mkdtemp(prefix="sasha_test_vault_")
os.environ["STORAGE_ROOT"] = _TEST_VAULT

# Pre-create directories that module-level code expects
_JSON_DIR = os.path.join(_TEST_VAULT, "json")
os.makedirs(os.path.join(_JSON_DIR, "streams"), exist_ok=True)
os.makedirs(os.path.join(_JSON_DIR, "block_collection"), exist_ok=True)
os.makedirs(os.path.join(_TEST_VAULT, "hopper"), exist_ok=True)


def _write_json(path: str, data: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# UserRepository loads users.json at import time — must exist before import
_write_json(
    os.path.join(_JSON_DIR, "users.json"),
    {
        "users": [
            {
                "username": "test-admin",
                "hashed_password": "$2b$12$KIXTfS7OM4gKSNEgvbqWdu0bRlPW3oVlMcF9DP6H4RQsYIbfPmQHC",
                "full_name": "Test Admin",
                "is_active": True,
            }
        ]
    },
)

# ---------------------------------------------------------------------------
# 2. Now it is safe to import app modules — they will resolve paths
#    relative to _TEST_VAULT.
# ---------------------------------------------------------------------------

from app.auth.dependencies import get_current_user  # noqa: E402
from app.auth.models import User  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

# ---------------------------------------------------------------------------
# Minimal seed data
# ---------------------------------------------------------------------------

SAMPLE_STREAM = {
    "streamId": "test-stream",
    "title": "Test Stream",
    "status": "draft",
    "tags": ["test"],
    "description": "A test stream",
    "thumbnail": "",
    "version": 1,
    "createdAt": "2025-01-01T00:00:00+00:00",
    "updatedAt": "2025-01-01T00:00:00+00:00",
    "blockIds": ["block-text-abc12345"],
}

SAMPLE_STREAMS_INDEX = {
    "version": 1,
    "updatedAt": "2025-01-01T00:00:00+00:00",
    "streams": [
        {
            "streamId": "test-stream",
            "title": "Test Stream",
            "thumbnail": "",
            "status": "draft",
            "tags": ["test"],
            "description": "A test stream",
            "updatedAt": "2025-01-01T00:00:00+00:00",
        }
    ],
}

SAMPLE_BLOCK_COLLECTION = {
    "kind": "BlockCollection",
    "version": 1,
    "generatedAt": "2025-01-01",
    "updatedAt": "2025-01-01",
    "blocks": {
        "block-text-abc12345": {
            "id": "block-text-abc12345",
            "blockKind": "text",
            "lifecycle": "saved",
            "dateCreated": "2025-01-01",
            "title": {"en": "Hello"},
            "body": {"en": "World"},
            "variant": "full",
        }
    },
    "order": ["block-text-abc12345"],
}

SAMPLE_PUBLIC_STREAM = {
    "kind": "PublicStream",
    "version": 1,
    "streamIds": ["test-stream"],
    "createdAt": "2025-01-01T00:00:00+00:00",
    "updatedAt": "2025-01-01T00:00:00+00:00",
}

SAMPLE_CATALOG = {
    "items": {},
    "order": [],
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_mock_user = User(
    username="test-admin",
    hashed_password="$2b$12$KIXTfS7OM4gKSNEgvbqWdu0bRlPW3oVlMcF9DP6H4RQsYIbfPmQHC",
    full_name="Test Admin",
    is_active=True,
)


def _seed_vault() -> None:
    """Write minimal fixture data into the test vault."""
    _write_json(
        os.path.join(_JSON_DIR, "streams", "index.json"),
        SAMPLE_STREAMS_INDEX,
    )
    _write_json(
        os.path.join(_JSON_DIR, "streams", "test-stream.json"),
        SAMPLE_STREAM,
    )
    _write_json(
        os.path.join(_JSON_DIR, "block_collection", "block_collection.json"),
        SAMPLE_BLOCK_COLLECTION,
    )
    _write_json(
        os.path.join(_JSON_DIR, "public_stream.json"),
        SAMPLE_PUBLIC_STREAM,
    )
    _write_json(
        os.path.join(_JSON_DIR, "art_catalog.json"),
        SAMPLE_CATALOG,
    )


@pytest.fixture(scope="session", autouse=True)
def seed_test_vault():
    """Seed the test vault with fixture data once for the whole session."""
    _seed_vault()
    yield


@pytest.fixture()
def client():
    """
    FastAPI TestClient with authentication bypassed.

    Admin endpoints that depend on ``get_current_user`` will receive a
    mock User without requiring real credentials.
    """
    fastapi_app.dependency_overrides[get_current_user] = lambda: _mock_user
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Session cleanup
# ---------------------------------------------------------------------------


def pytest_sessionfinish(session, exitstatus):
    """Remove the temporary vault after all tests have run."""
    shutil.rmtree(_TEST_VAULT, ignore_errors=True)
