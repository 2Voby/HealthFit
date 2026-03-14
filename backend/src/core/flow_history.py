from src.models import Flow, FlowHistory, FlowQuestion, FlowTransition, FlowTransitionAnswer, User
from src.schemas.flow import FlowHistoryAction, FlowSnapshot, FlowTransitionCreateRequest


def transition_condition_value(condition_type: object) -> str:
    if hasattr(condition_type, "value"):
        return str(getattr(condition_type, "value"))
    return str(condition_type)


async def to_flow_snapshot(flow: Flow) -> FlowSnapshot:
    flow_questions = await FlowQuestion.filter(flow=flow).order_by("position")
    question_ids = [item.question_id for item in flow_questions]

    transitions = await FlowTransition.filter(flow=flow).order_by("from_question_id", "priority", "id")
    transition_ids = [transition.id for transition in transitions]
    answer_rows = []
    if transition_ids:
        answer_rows = await FlowTransitionAnswer.filter(transition_id__in=transition_ids).order_by(
            "transition_id",
            "answer_id",
        )

    transition_answers_map: dict[int, list[int]] = {}
    for row in answer_rows:
        transition_answers_map.setdefault(row.transition_id, []).append(row.answer_id)

    transition_payloads = []
    for transition in transitions:
        transition_payloads.append(
            FlowTransitionCreateRequest(
                from_question_id=transition.from_question_id,
                to_question_id=transition.to_question_id,
                condition_type=transition_condition_value(transition.condition_type),
                answer_ids=transition_answers_map.get(transition.id, []),
                priority=transition.priority,
            )
        )

    return FlowSnapshot(
        name=flow.name,
        is_active=flow.is_active,
        question_ids=question_ids,
        transitions=transition_payloads,
    )


async def get_next_flow_revision(flow_id: int) -> int:
    latest_history_entry = await FlowHistory.filter(flow_id=flow_id).order_by("-revision").first()
    if latest_history_entry is None:
        return 1
    return latest_history_entry.revision + 1


async def create_flow_history_entry(
    flow: Flow,
    action: FlowHistoryAction,
    changed_by_user: User | None,
    source_revision: int | None = None,
) -> FlowHistory:
    snapshot = await to_flow_snapshot(flow)
    return await FlowHistory.create(
        flow=flow,
        revision=await get_next_flow_revision(flow.id),
        action=action.value,
        snapshot=snapshot.model_dump(mode="json"),
        source_revision=source_revision,
        changed_by_user=changed_by_user,
    )


async def create_flow_history_for_all_flows(
    changed_by_user: User | None,
    action: FlowHistoryAction = FlowHistoryAction.dependency_update,
) -> None:
    flows = await Flow.all().order_by("id")
    for flow in flows:
        await create_flow_history_entry(
            flow=flow,
            action=action,
            changed_by_user=changed_by_user,
        )
