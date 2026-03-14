from __future__ import annotations

from uuid import uuid4


def create_attribute(admin_client, name: str) -> int:
    response = admin_client.post("/v1/attributes/", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_offer_crud_and_selection_engine(admin_client) -> None:
    suffix = uuid4().hex[:8]
    attr_goal = create_attribute(admin_client, f"goal_weight_loss_{suffix}")
    attr_home = create_attribute(admin_client, f"context_home_{suffix}")
    attr_time = create_attribute(admin_client, f"time_20_30_{suffix}")
    attr_excluded = create_attribute(admin_client, f"injury_knee_or_back_{suffix}")

    primary_name = f"Weight Plan {suffix}"
    excluded_name = f"Excluded Plan {suffix}"

    primary_offer_response = admin_client.post(
        "/v1/offers/",
        json={
            "name": primary_name,
            "description": "Main plan",
            "price": 49.99,
            "requires_all": [attr_goal, attr_home],
            "requires_optional": [attr_time],
            "excludes": [],
            "priority": 50,
        },
    )
    assert primary_offer_response.status_code == 201, primary_offer_response.text

    excluded_offer_response = admin_client.post(
        "/v1/offers/",
        json={
            "name": excluded_name,
            "descripton": "Will be filtered by excludes alias",
            "price": 59.99,
            "requires_all": [attr_goal],
            "requires_optional": [],
            "exludes": [attr_excluded],
            "priority": 100,
        },
    )
    assert excluded_offer_response.status_code == 201, excluded_offer_response.text

    selection_response = admin_client.post(
        "/v1/offers/selection",
        json={"attributes": [attr_goal, attr_home, attr_time]},
    )
    assert selection_response.status_code == 200, selection_response.text
    selection_items = selection_response.json()["items"]
    selected_offer_names = [item["offer"]["name"] for item in selection_items]
    assert excluded_name in selected_offer_names
    assert primary_name in selected_offer_names

    selection_with_excluded_attr_response = admin_client.post(
        "/v1/offers/selection",
        json={"attributes": [attr_goal, attr_home, attr_time, attr_excluded]},
    )
    assert selection_with_excluded_attr_response.status_code == 200, selection_with_excluded_attr_response.text
    filtered_items = selection_with_excluded_attr_response.json()["items"]
    filtered_offer_names = [item["offer"]["name"] for item in filtered_items]
    assert primary_name in filtered_offer_names
    assert excluded_name not in filtered_offer_names
