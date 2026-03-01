"""Integration tests for the blocks API (admin + public)."""


def test_get_block_collection(client):
    response = client.get("/blocks/collection")
    assert response.status_code == 200
    data = response.json()
    assert data["kind"] == "BlockCollection"
    assert "block-text-abc12345" in data["blocks"]


def test_public_get_blocks_by_ids(client):
    response = client.get(
        "/public/blocks/by-ids",
        params={"ids": "block-text-abc12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "block-text-abc12345" in data
    assert data["block-text-abc12345"]["blockKind"] == "text"


def test_public_get_blocks_by_ids_empty(client):
    response = client.get(
        "/public/blocks/by-ids",
        params={"ids": "nonexistent-block"},
    )
    assert response.status_code == 200
    assert response.json() == {}
