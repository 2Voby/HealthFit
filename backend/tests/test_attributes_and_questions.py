from __future__ import annotations

from uuid import uuid4


def test_attributes_crud(admin_client) -> None:
    base_name = f"goal_custom_{uuid4().hex[:8]}"
    create_response = admin_client.post("/v1/attributes/", json={"name": base_name})
    assert create_response.status_code == 201, create_response.text
    attribute_id = create_response.json()["id"]

    get_response = admin_client.get(f"/v1/attributes/{attribute_id}")
    assert get_response.status_code == 200, get_response.text
    assert get_response.json()["name"] == base_name

    updated_name = f"{base_name}_updated"
    patch_response = admin_client.patch(
        f"/v1/attributes/{attribute_id}",
        json={"name": updated_name},
    )
    assert patch_response.status_code == 200, patch_response.text
    assert patch_response.json()["name"] == updated_name

    delete_response = admin_client.delete(f"/v1/attributes/{attribute_id}")
    assert delete_response.status_code == 204, delete_response.text


def test_questions_support_text_type_and_validate_answers(admin_client) -> None:
    text_with_answers_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Info screen",
            "type": "text",
            "requires": False,
            "answers": [{"text": "not allowed", "attributes": []}],
        },
    )
    assert text_with_answers_response.status_code == 400, text_with_answers_response.text

    text_question_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Це інформаційний екран",
            "type": "text",
            "requires": False,
            "answers": [],
        },
    )
    assert text_question_response.status_code == 201, text_question_response.text
    assert text_question_response.json()["type"] == "text"
    assert text_question_response.json()["answers"] == []

    text_requires_true_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Bad info screen",
            "type": "text",
            "requires": True,
            "answers": [],
        },
    )
    assert text_requires_true_response.status_code == 400, text_requires_true_response.text

    manual_input_with_answers_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Manual input question",
            "type": "manual_input",
            "manual_input": {"type": "number", "min": 10, "max": 99},
            "requires": False,
            "answers": [{"text": "bad", "attributes": []}],
        },
    )
    assert manual_input_with_answers_response.status_code == 400, manual_input_with_answers_response.text

    manual_input_question_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Ваш вік?",
            "type": "manual_input",
            "manual_input": {"type": "number", "min": 18, "max": 100},
            "requires": True,
            "answers": [],
        },
    )
    assert manual_input_question_response.status_code == 201, manual_input_question_response.text
    manual_question = manual_input_question_response.json()
    assert manual_question["type"] == "manual_input"
    assert manual_question["manual_input"] == {"type": "number", "min": 18, "max": 100}
    assert manual_question["answers"] == []

    invalid_manual_input_response = admin_client.post(
        "/v1/questions/",
        json={
            "text": "Broken range",
            "type": "manual_input",
            "manual_input": {"type": "number", "min": 100, "max": 18},
            "requires": True,
            "answers": [],
        },
    )
    assert invalid_manual_input_response.status_code == 422, invalid_manual_input_response.text
