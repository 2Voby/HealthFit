from __future__ import annotations

from uuid import uuid4


def test_register_me_logout_flow(client) -> None:
    login = f"user_{uuid4().hex[:8]}"
    password = "StrongPass123"

    register_response = client.post(
        "/v1/auth/register",
        json={"login": login, "password": password},
    )
    assert register_response.status_code == 201, register_response.text
    assert register_response.json()["login"] == login

    me_response = client.get("/v1/auth/me")
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["login"] == login

    logout_response = client.post("/v1/auth/logout")
    assert logout_response.status_code == 204, logout_response.text

    me_after_logout_response = client.get("/v1/auth/me")
    assert me_after_logout_response.status_code == 401, me_after_logout_response.text


def test_protected_users_create_requires_authority(client) -> None:
    response = client.post(
        "/v1/users/",
        json={
            "login": f"manager_{uuid4().hex[:8]}",
            "password": "StrongPass123",
            "authorities": ["edit_elements"],
        },
    )
    assert response.status_code == 401, response.text


def test_admin_can_create_update_and_get_user(admin_client) -> None:
    login = f"manager_{uuid4().hex[:8]}"
    create_response = admin_client.post(
        "/v1/users/",
        json={
            "login": login,
            "password": "StrongPass123",
            "authorities": ["edit_elements"],
        },
    )
    assert create_response.status_code == 201, create_response.text
    user_payload = create_response.json()
    assert user_payload["login"] == login
    assert "edit_elements" in user_payload["authorities"]

    user_id = user_payload["id"]
    update_response = admin_client.patch(
        f"/v1/users/{user_id}",
        json={
            "login": login,
            "authorities": ["read_users"],
        },
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["authorities"] == ["read_users"]

    get_response = admin_client.get(f"/v1/users/{user_id}")
    assert get_response.status_code == 200, get_response.text
    assert get_response.json()["login"] == login
