from __future__ import annotations

from uuid import uuid4


def create_attribute(admin_client, name: str) -> int:
    response = admin_client.post("/v1/attributes/", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_question(
    admin_client,
    text: str,
    question_type: str,
    requires: bool = False,
    answers: list[dict] | None = None,
    manual_input: dict | None = None,
) -> dict:
    response = admin_client.post(
        "/v1/questions/",
        json={
            "text": text,
            "type": question_type,
            "manual_input": manual_input,
            "requires": requires,
            "answers": answers or [],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_flow_session_persists_context_answers_and_derived_attributes(admin_client) -> None:
    suffix = uuid4().hex[:8]
    attr_goal = create_attribute(admin_client, f"session_goal_{suffix}")
    attr_manual = create_attribute(admin_client, f"session_manual_{suffix}")

    q_goal = create_question(
        admin_client,
        f"Goal {suffix}",
        "singe_choise",
        requires=True,
        answers=[
            {"text": "Weight loss", "attributes": [attr_goal]},
            {"text": "Strength", "attributes": []},
        ],
    )
    q_manual = create_question(
        admin_client,
        f"Manual {suffix}",
        "manual_input",
        requires=True,
        manual_input={"type": "number", "min": 10, "max": 60},
    )
    q_text = create_question(
        admin_client,
        f"Info {suffix}",
        "text",
    )

    create_flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Session Flow {suffix}",
            "is_active": True,
            "question_ids": [q_goal["id"], q_manual["id"], q_text["id"]],
            "transitions": [
                {
                    "from_question_id": q_goal["id"],
                    "to_question_id": q_manual["id"],
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
                {
                    "from_question_id": q_manual["id"],
                    "to_question_id": q_text["id"],
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
                {
                    "from_question_id": q_text["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
            ],
        },
    )
    assert create_flow_response.status_code == 201, create_flow_response.text

    create_session_response = admin_client.post(
        "/v1/flows/active/session",
        json={"context": {"utm_source": "instagram"}},
    )
    assert create_session_response.status_code == 201, create_session_response.text
    session = create_session_response.json()
    session_id = session["id"]
    assert session["status"] == "in_progress"
    assert session["current_question_id"] == q_goal["id"]

    answer_id = q_goal["answers"][0]["id"]
    next_after_goal_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={
            "selected_answer_ids": [answer_id],
            "context_patch": {"campaign": "spring_sale"},
        },
    )
    assert next_after_goal_response.status_code == 200, next_after_goal_response.text
    next_after_goal = next_after_goal_response.json()
    assert next_after_goal["next_question_id"] == q_manual["id"]
    assert next_after_goal["is_finished"] is False

    session_after_goal_response = admin_client.get(f"/v1/flows/session/{session_id}")
    assert session_after_goal_response.status_code == 200, session_after_goal_response.text
    session_after_goal = session_after_goal_response.json()
    assert session_after_goal["context"]["utm_source"] == "instagram"
    assert session_after_goal["context"]["campaign"] == "spring_sale"
    goal_answer_item = next(item for item in session_after_goal["answers"] if item["question_id"] == q_goal["id"])
    assert goal_answer_item["selected_answer_ids"] == [answer_id]
    assert goal_answer_item["manual_input"] is None
    derived_attribute_ids = [item["attribute_id"] for item in session_after_goal["derived_attributes"]]
    assert attr_goal in derived_attribute_ids

    next_after_manual_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={
            "selected_answer_ids": [],
            "manual_input": "30",
            "derived_attribute_ids": [attr_manual],
        },
    )
    assert next_after_manual_response.status_code == 200, next_after_manual_response.text
    assert next_after_manual_response.json()["next_question_id"] == q_text["id"]

    session_after_manual_response = admin_client.get(f"/v1/flows/session/{session_id}")
    assert session_after_manual_response.status_code == 200, session_after_manual_response.text
    session_after_manual = session_after_manual_response.json()
    manual_answer_item = next(item for item in session_after_manual["answers"] if item["question_id"] == q_manual["id"])
    assert manual_answer_item["manual_input"] == "30"
    manual_derived_item = next(
        item for item in session_after_manual["derived_attributes"] if item["attribute_id"] == attr_manual
    )
    assert manual_derived_item["source"] == "manual_input"

    finish_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={},
    )
    assert finish_response.status_code == 200, finish_response.text
    finish_body = finish_response.json()
    assert finish_body["is_finished"] is True
    assert finish_body["next_question_id"] is None

    final_session_response = admin_client.get(f"/v1/flows/session/{session_id}")
    assert final_session_response.status_code == 200, final_session_response.text
    final_session = final_session_response.json()
    assert final_session["status"] == "completed"
    assert final_session["current_question_id"] is None


def test_flow_session_manual_input_required_validation(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q_manual = create_question(
        admin_client,
        f"Manual Required {suffix}",
        "manual_input",
        requires=True,
        manual_input={"type": "number", "min": 18, "max": 99},
    )

    flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Manual Validation Flow {suffix}",
            "is_active": True,
            "question_ids": [q_manual["id"]],
            "transitions": [
                {
                    "from_question_id": q_manual["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                }
            ],
        },
    )
    assert flow_response.status_code == 201, flow_response.text

    create_session_response = admin_client.post("/v1/flows/active/session", json={})
    assert create_session_response.status_code == 201, create_session_response.text
    session_id = create_session_response.json()["id"]

    next_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={"selected_answer_ids": []},
    )
    assert next_response.status_code == 400, next_response.text


def test_flow_session_manual_input_number_validation(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q_manual = create_question(
        admin_client,
        f"Manual Number {suffix}",
        "manual_input",
        requires=True,
        manual_input={"type": "number", "min": 150, "max": 220},
    )

    flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Manual Number Flow {suffix}",
            "is_active": True,
            "question_ids": [q_manual["id"]],
            "transitions": [
                {
                    "from_question_id": q_manual["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                }
            ],
        },
    )
    assert flow_response.status_code == 201, flow_response.text

    create_session_response = admin_client.post("/v1/flows/active/session", json={})
    assert create_session_response.status_code == 201, create_session_response.text
    session_id = create_session_response.json()["id"]

    non_numeric_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={"manual_input": "abc"},
    )
    assert non_numeric_response.status_code == 400, non_numeric_response.text

    out_of_range_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={"manual_input": "149"},
    )
    assert out_of_range_response.status_code == 400, out_of_range_response.text

    valid_response = admin_client.post(
        f"/v1/flows/session/{session_id}/next",
        json={"manual_input": "180"},
    )
    assert valid_response.status_code == 200, valid_response.text
    assert valid_response.json()["is_finished"] is True
