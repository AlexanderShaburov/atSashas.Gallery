"""Integration tests for the admin streams API."""


def test_list_streams(client):
    response = client.get("/admin/streams")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(s["streamId"] == "test-stream" for s in data)


def test_get_stream_by_id(client):
    response = client.get("/admin/streams/test-stream")
    assert response.status_code == 200
    data = response.json()
    assert data["streamId"] == "test-stream"
    assert data["title"] == "Test Stream"
    assert "version" in data
    assert "blockIds" in data


def test_get_nonexistent_stream_returns_404(client):
    response = client.get("/admin/streams/does-not-exist")
    assert response.status_code == 404


def test_create_stream(client):
    response = client.post(
        "/admin/streams",
        json={
            "streamId": "pytest-created",
            "title": "Created by pytest",
            "tags": ["ci"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["streamId"] == "pytest-created"
    assert data["status"] == "draft"
    assert data["version"] == 1
