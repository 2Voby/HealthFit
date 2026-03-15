from __future__ import annotations

from uuid import uuid4


def create_question(admin_client, text: str, question_type: str, answers: list[dict] | None = None) -> dict:
    payload = {
        "text": text,
        "type": question_type,
        "requires": False,
        "answers": answers or [],
    }
    response = admin_client.post("/v1/questions/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_flow_branching_and_next_resolution(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q_goal = create_question(
        admin_client,
        f"Goal? {suffix}",
        "singe_choise",
        answers=[{"text": "Yes", "attributes": []}, {"text": "No", "attributes": []}],
    )
    q_info = create_question(admin_client, f"Info screen {suffix}", "text")
    q_input = create_question(admin_client, f"Manual input {suffix}", "manual_input")

    yes_answer_id = q_goal["answers"][0]["id"]
    no_answer_id = q_goal["answers"][1]["id"]

    create_flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Flow A {suffix}",
            "is_active": True,
            "question_ids": [q_goal["id"], q_info["id"], q_input["id"]],
            "transitions": [
                {
                    "from_question_id": q_goal["id"],
                    "to_question_id": q_info["id"],
                    "condition_type": "answer_any",
                    "answer_ids": [yes_answer_id],
                    "priority": 10,
                },
                {
                    "from_question_id": q_goal["id"],
                    "to_question_id": q_input["id"],
                    "condition_type": "answer_any",
                    "answer_ids": [no_answer_id],
                    "priority": 20,
                },
                {
                    "from_question_id": q_info["id"],
                    "to_question_id": q_input["id"],
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
                {
                    "from_question_id": q_input["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
            ],
        },
    )
    assert create_flow_response.status_code == 201, create_flow_response.text
    flow_id = create_flow_response.json()["id"]

    next_from_goal_response = admin_client.post(
        f"/v1/flows/{flow_id}/next",
        json={"current_question_id": q_goal["id"], "selected_answer_ids": [yes_answer_id]},
    )
    assert next_from_goal_response.status_code == 200, next_from_goal_response.text
    assert next_from_goal_response.json()["next_question_id"] == q_info["id"]

    text_with_answers_response = admin_client.post(
        f"/v1/flows/{flow_id}/next",
        json={"current_question_id": q_info["id"], "selected_answer_ids": [yes_answer_id]},
    )
    assert text_with_answers_response.status_code == 400, text_with_answers_response.text

    text_without_answers_response = admin_client.post(
        f"/v1/flows/{flow_id}/next",
        json={"current_question_id": q_info["id"], "selected_answer_ids": []},
    )
    assert text_without_answers_response.status_code == 200, text_without_answers_response.text
    assert text_without_answers_response.json()["next_question_id"] == q_input["id"]


def test_only_one_active_flow_and_history_with_rollback(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q1 = create_question(admin_client, f"Q1 {suffix}", "text")
    q2 = create_question(admin_client, f"Q2 {suffix}", "text")

    flow1_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Flow One {suffix}",
            "is_active": True,
            "question_ids": [q1["id"], q2["id"]],
            "transitions": [
                {
                    "from_question_id": q1["id"],
                    "to_question_id": q2["id"],
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
                {
                    "from_question_id": q2["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
            ],
        },
    )
    assert flow1_response.status_code == 201, flow1_response.text
    flow1_id = flow1_response.json()["id"]

    flow2_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Flow Two {suffix}",
            "is_active": True,
            "question_ids": [q1["id"]],
            "transitions": [
                {
                    "from_question_id": q1["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                }
            ],
        },
    )
    assert flow2_response.status_code == 201, flow2_response.text
    flow2_id = flow2_response.json()["id"]

    active_flow_response = admin_client.get("/v1/flows/active")
    assert active_flow_response.status_code == 200, active_flow_response.text
    assert active_flow_response.json()["id"] == flow2_id

    flow1_state_response = admin_client.get(f"/v1/flows/{flow1_id}")
    assert flow1_state_response.status_code == 200, flow1_state_response.text
    assert flow1_state_response.json()["is_active"] is False

    patch_response = admin_client.patch(
        f"/v1/flows/{flow1_id}",
        json={"name": f"Flow One Updated {suffix}"},
    )
    assert patch_response.status_code == 200, patch_response.text

    history_after_patch_response = admin_client.get(f"/v1/flows/{flow1_id}/history")
    assert history_after_patch_response.status_code == 200, history_after_patch_response.text
    history_after_patch = history_after_patch_response.json()["items"]
    assert history_after_patch[0]["action"] == "update"
    assert history_after_patch[0]["revision"] == 2
    assert history_after_patch[1]["action"] == "create"
    assert history_after_patch[1]["revision"] == 1

    rollback_response = admin_client.post(f"/v1/flows/{flow1_id}/rollback/1")
    assert rollback_response.status_code == 200, rollback_response.text
    assert rollback_response.json()["name"] == f"Flow One {suffix}"

    history_after_rollback_response = admin_client.get(f"/v1/flows/{flow1_id}/history")
    assert history_after_rollback_response.status_code == 200, history_after_rollback_response.text
    history_after_rollback = history_after_rollback_response.json()["items"]
    assert history_after_rollback[0]["action"] == "rollback"
    assert history_after_rollback[0]["source_revision"] == 1
    assert history_after_rollback[0]["revision"] == 3


def test_flow_rollback_survives_question_answer_updates(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q_choice = create_question(
        admin_client,
        f"Goal? {suffix}",
        "singe_choise",
        answers=[{"text": "Yes", "attributes": []}, {"text": "No", "attributes": []}],
    )
    q_done = create_question(admin_client, f"Done {suffix}", "text")

    yes_answer_id = q_choice["answers"][0]["id"]
    no_answer_id = q_choice["answers"][1]["id"]

    create_flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Rollback Safe {suffix}",
            "is_active": False,
            "question_ids": [q_choice["id"], q_done["id"]],
            "transitions": [
                {
                    "from_question_id": q_choice["id"],
                    "to_question_id": q_done["id"],
                    "condition_type": "answer_any",
                    "answer_ids": [yes_answer_id],
                    "priority": 10,
                },
                {
                    "from_question_id": q_choice["id"],
                    "to_question_id": None,
                    "condition_type": "answer_any",
                    "answer_ids": [no_answer_id],
                    "priority": 20,
                },
                {
                    "from_question_id": q_done["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                },
            ],
        },
    )
    assert create_flow_response.status_code == 201, create_flow_response.text
    flow_id = create_flow_response.json()["id"]

    update_question_response = admin_client.patch(
        f"/v1/questions/{q_choice['id']}",
        json={
            "answers": [
                {"text": "Absolutely", "attributes": []},
                {"text": "Never", "attributes": []},
            ]
        },
    )
    assert update_question_response.status_code == 200, update_question_response.text
    updated_question = update_question_response.json()
    assert updated_question["answers"][0]["id"] == yes_answer_id
    assert updated_question["answers"][1]["id"] == no_answer_id

    patch_flow_response = admin_client.patch(
        f"/v1/flows/{flow_id}",
        json={"name": f"Rollback Safe Updated {suffix}"},
    )
    assert patch_flow_response.status_code == 200, patch_flow_response.text

    rollback_response = admin_client.post(f"/v1/flows/{flow_id}/rollback/1")
    assert rollback_response.status_code == 200, rollback_response.text
    rolled_back_flow = rollback_response.json()
    assert rolled_back_flow["name"] == f"Rollback Safe {suffix}"
    assert rolled_back_flow["transitions"][0]["answer_ids"] == [yes_answer_id]
    assert rolled_back_flow["transitions"][1]["answer_ids"] == [no_answer_id]


def test_dependency_updates_are_written_to_flow_history(admin_client) -> None:
    suffix = uuid4().hex[:8]
    q = create_question(admin_client, f"Info {suffix}", "text")
    flow_response = admin_client.post(
        "/v1/flows/",
        json={
            "name": f"Flow With Dependency {suffix}",
            "is_active": False,
            "question_ids": [q["id"]],
            "transitions": [
                {
                    "from_question_id": q["id"],
                    "to_question_id": None,
                    "condition_type": "always",
                    "answer_ids": [],
                    "priority": 10,
                }
            ],
        },
    )
    assert flow_response.status_code == 201, flow_response.text
    flow_id = flow_response.json()["id"]

    create_attr_response = admin_client.post("/v1/attributes/", json={"name": f"dependency_signal_{suffix}"})
    assert create_attr_response.status_code == 201, create_attr_response.text

    history_response = admin_client.get(f"/v1/flows/{flow_id}/history")
    assert history_response.status_code == 200, history_response.text
    history_items = history_response.json()["items"]
    assert history_items[0]["action"] == "dependency_update"
    assert history_items[0]["revision"] == 2
