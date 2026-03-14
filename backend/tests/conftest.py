import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def admin_client(client: TestClient) -> TestClient:
    response = client.post(
        "/v1/auth/login",
        json={"login": "admin", "password": "admin12345"},
    )
    assert response.status_code == 200, response.text
    return client
