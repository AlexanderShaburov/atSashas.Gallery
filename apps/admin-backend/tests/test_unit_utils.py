"""Unit tests for slug generation, path sanitisation, and model helpers."""

from app.models.block_collection import BlockCollection
from app.services.block_collection_service import _slug_segment
from app.storage import json_path


def test_slug_segment_normalises():
    assert _slug_segment("Hello World") == "hello-world"
    assert _slug_segment("  foo_bar  ") == "foo-bar"
    assert _slug_segment("UPPER") == "upper"


def test_json_path_strips_unsafe_chars():
    """Characters like / and . are removed so paths stay inside JSON_DIR."""
    p = json_path("../../etc/passwd")
    assert ".." not in p.name
    assert "/" not in p.name
    assert p.name == "etcpasswd.json"


def test_block_collection_create_empty():
    coll = BlockCollection.create_empty()
    assert coll.kind == "BlockCollection"
    assert coll.blocks == {}
    assert coll.order == []
    assert coll.version == 1
