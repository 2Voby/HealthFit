from src.core.config import Settings
from src.core.security import hash_password
from src.models import Attribute, Authority, Flow, FlowQuestion, Offer, Question, QuestionAnswer, User


async def bootstrap_authorities(settings: Settings) -> None:
    for authority_name in settings.bootstrap_authorities:
        await Authority.get_or_create(name=authority_name)


async def bootstrap_admin(settings: Settings) -> None:
    if not settings.bootstrap_admin_login or not settings.bootstrap_admin_password:
        return

    user, _ = await User.get_or_create(
        login=settings.bootstrap_admin_login,
        defaults={"password_hash": hash_password(settings.bootstrap_admin_password)},
    )

    authorities = await Authority.filter(name__in=settings.bootstrap_admin_authorities)
    if authorities:
        await user.authorities.add(*authorities)


async def bootstrap_mock_data(settings: Settings) -> None:
    if not settings.bootstrap_mock_data:
        return

    if await Attribute.exists() or await Question.exists() or await Offer.exists() or await Flow.exists():
        return

    attribute_names = [
        "goal_weight_loss",
        "goal_strength",
        "goal_flexibility",
        "goal_stress",
        "goal_endurance",
        "context_home",
        "context_gym",
        "context_outdoor",
        "time_10_15",
        "time_20_30",
        "injury_knee_or_back",
        "injury_none",
        "stress_high",
        "stress_low",
    ]
    attributes_by_name: dict[str, Attribute] = {}
    for name in attribute_names:
        attribute = await Attribute.create(name=name)
        attributes_by_name[name] = attribute

    async def create_question_with_answers(
        text: str,
        question_type: str,
        requires: bool,
        answers: list[tuple[str, list[str]]],
    ) -> Question:
        question = await Question.create(
            text=text,
            type=question_type,
            requires=requires,
        )
        for answer_text, answer_attribute_names in answers:
            answer = await QuestionAnswer.create(
                question=question,
                text=answer_text,
            )
            if answer_attribute_names:
                await answer.attributes.add(*(attributes_by_name[name] for name in answer_attribute_names))
        return question

    q_goal = await create_question_with_answers(
        text="Яка ваша головна ціль?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Схуднення", ["goal_weight_loss"]),
            ("Сила", ["goal_strength"]),
            ("Гнучкість", ["goal_flexibility"]),
            ("Зниження стресу", ["goal_stress"]),
            ("Витривалість", ["goal_endurance"]),
        ],
    )
    q_context = await create_question_with_answers(
        text="Де вам зручніше займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["context_home"]),
            ("У залі", ["context_gym"]),
            ("На вулиці", ["context_outdoor"]),
        ],
    )
    q_time = await create_question_with_answers(
        text="Скільки часу на день?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("10–15 хв", ["time_10_15"]),
            ("20–30 хв", ["time_20_30"]),
        ],
    )
    q_injury = await create_question_with_answers(
        text="Чи є травми?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Коліна/спина", ["injury_knee_or_back"]),
            ("Немає", ["injury_none"]),
        ],
    )
    q_stress = await create_question_with_answers(
        text="Ваш рівень стресу?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Високий", ["stress_high"]),
            ("Низький", ["stress_low"]),
        ],
    )

    async def create_offer(
        name: str,
        description: str,
        price: float,
        priority: int,
        requires_all: list[str],
        requires_optional: list[str],
        excludes: list[str],
    ) -> Offer:
        offer = await Offer.create(
            name=name,
            description=description,
            price=price,
            priority=priority,
        )
        if requires_all:
            await offer.requires_all.add(*(attributes_by_name[attr_name] for attr_name in requires_all))
        if requires_optional:
            await offer.requires_optional.add(*(attributes_by_name[attr_name] for attr_name in requires_optional))
        if excludes:
            await offer.excludes.add(*(attributes_by_name[attr_name] for attr_name in excludes))
        return offer

    await create_offer(
        name="Weight Loss Starter (Home)",
        description="4-тижневий план схуднення вдома (20–30 хв) + Home Fat-Burn Kit.",
        price=49.99,
        priority=90,
        requires_all=["goal_weight_loss", "context_home", "time_20_30"],
        requires_optional=[],
        excludes=[],
    )
    await create_offer(
        name="Lean Strength Builder (Gym)",
        description="Силова програма для залу + Gym Support Kit.",
        price=59.99,
        priority=88,
        requires_all=["goal_strength", "context_gym", "injury_none"],
        requires_optional=[],
        excludes=["injury_knee_or_back"],
    )
    await create_offer(
        name="Low-Impact Fat Burn",
        description="Суглобо-friendly план + Joint-Friendly Kit.",
        price=54.99,
        priority=86,
        requires_all=["goal_strength", "context_gym", "injury_knee_or_back"],
        requires_optional=[],
        excludes=[],
    )
    await create_offer(
        name="Run Your First 5K (Outdoor)",
        description="Бігова програма 3x/тиж + Runner Starter Kit.",
        price=44.99,
        priority=84,
        requires_all=["goal_endurance", "context_outdoor"],
        requires_optional=[],
        excludes=[],
    )
    await create_offer(
        name="Yoga & Mobility (Home)",
        description="Йога/мобільність 10–25 хв + Mobility Kit.",
        price=39.99,
        priority=82,
        requires_all=["goal_flexibility", "context_home"],
        requires_optional=[],
        excludes=[],
    )
    await create_offer(
        name="Stress Reset Program",
        description="Ментальний ресет + Calm-Now Kit.",
        price=29.99,
        priority=70,
        requires_all=["stress_high"],
        requires_optional=["goal_stress"],
        excludes=[],
    )
    await create_offer(
        name="Quick Fit Micro-Workouts",
        description="Щоденні 10–15 хв тренування + Micro-Workout Kit.",
        price=34.99,
        priority=95,
        requires_all=["goal_weight_loss", "context_home", "time_10_15"],
        requires_optional=[],
        excludes=[],
    )

    flow = await Flow.create(
        name="Default Wellness Flow",
        is_active=True,
    )
    ordered_questions = [q_goal, q_context, q_time, q_injury, q_stress]
    for position, question in enumerate(ordered_questions, start=1):
        await FlowQuestion.create(
            flow=flow,
            question=question,
            position=position,
        )
