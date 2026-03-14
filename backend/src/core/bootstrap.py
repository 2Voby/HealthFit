from src.core.config import Settings
from src.core.security import hash_password
from src.models import (
    Attribute,
    Authority,
    Flow,
    FlowQuestion,
    FlowTransition,
    FlowTransitionAnswer,
    Offer,
    Question,
    QuestionAnswer,
    User,
)


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
        "time_30_45",
        "injury_knee_or_back",
        "injury_none",
        "stress_low",
        "stress_medium",
        "stress_high",
        "level_beginner",
        "level_intermediate",
        "level_advanced",
        "preference_strength",
        "preference_running",
        "preference_yoga",
        "preference_mobility",
        "preference_low_impact",
        "preference_short_sessions",
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
    ) -> tuple[Question, dict[str, QuestionAnswer]]:
        question = await Question.create(
            text=text,
            type=question_type,
            requires=requires,
        )
        created_answers: dict[str, QuestionAnswer] = {}
        for answer_text, answer_attribute_names in answers:
            answer = await QuestionAnswer.create(
                question=question,
                text=answer_text,
            )
            created_answers[answer_text] = answer
            if answer_attribute_names:
                await answer.attributes.add(*(attributes_by_name[name] for name in answer_attribute_names))
        return question, created_answers

    q_goal, _ = await create_question_with_answers(
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
    q_context, q_context_answers = await create_question_with_answers(
        text="Де вам зручніше займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["context_home"]),
            ("У залі", ["context_gym"]),
            ("На вулиці", ["context_outdoor"]),
        ],
    )
    q_time, _ = await create_question_with_answers(
        text="Скільки часу на день?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("10–15 хв", ["time_10_15", "preference_short_sessions"]),
            ("20–30 хв", ["time_20_30"]),
            ("30–45 хв", ["time_30_45", "level_intermediate"]),
        ],
    )
    q_injury, _ = await create_question_with_answers(
        text="Чи є травми?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Коліна/спина", ["injury_knee_or_back"]),
            ("Немає", ["injury_none"]),
        ],
    )
    q_level, _ = await create_question_with_answers(
        text="Ваш рівень підготовки?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Beginner", ["level_beginner"]),
            ("Intermediate", ["level_intermediate"]),
            ("Advanced", ["level_advanced"]),
        ],
    )
    q_preferences, _ = await create_question_with_answers(
        text="Який формат вам ближчий?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Силові тренування", ["preference_strength"]),
            ("Біг", ["preference_running"]),
            ("Йога", ["preference_yoga"]),
            ("Мобільність/розтяжка", ["preference_mobility"]),
            ("Low-impact тренування", ["preference_low_impact"]),
            ("Короткі сесії", ["preference_short_sessions"]),
        ],
    )
    q_stress, _ = await create_question_with_answers(
        text="Ваш рівень стресу?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Низький", ["stress_low"]),
            ("Середній", ["stress_medium"]),
            ("Високий", ["stress_high"]),
        ],
    )
    q_final_text, _ = await create_question_with_answers(
        text="Ви за один крок до успху. Натисніть далі, щоб побачити персональний офер.",
        question_type="text",
        requires=False,
        answers=[],
    )

    async def create_offer(
        name: str,
        description: str,
        price: float,
        priority: int,
        default: bool,
        requires_all: list[str],
        requires_optional: list[str],
        excludes: list[str],
    ) -> Offer:
        offer = await Offer.create(
            name=name,
            description=description,
            price=price,
            is_default=default,
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
        name="Weight Loss Starter (Home) — 4 тижні",
        description=(
            "Digital: план схуднення вдома (20–30 хв)\n"
            "Physical wellness kit: Home Fat-Burn Kit (resistance bands, скакалка, "
            "шейкер/пляшка, електроліти + healthy snack)"
        ),
        price=49.99,
        priority=90,
        default=False,
        requires_all=["goal_weight_loss", "context_home", "time_20_30"],
        requires_optional=["level_beginner", "preference_short_sessions"],
        excludes=[],
    )
    await create_offer(
        name="Lean Strength Builder (Gym) — силові + прогресія",
        description=(
            "Digital: програма для залу\n"
            "Physical wellness kit: Gym Support Kit (wrist wraps/straps, mini loop band, "
            "компактний рушник, електроліти/протеїн-снек)"
        ),
        price=59.99,
        priority=88,
        default=False,
        requires_all=["goal_strength", "context_gym", "injury_none"],
        requires_optional=["level_intermediate", "level_advanced", "preference_strength"],
        excludes=["injury_knee_or_back"],
    )
    await create_offer(
        name="Low-Impact Fat Burn — “суглоби friendly”",
        description=(
            "Digital: low-impact план (коліна/спина friendly)\n"
            "Physical wellness kit: Joint-Friendly Kit (knee sleeve/бандаж, massage ball, "
            "mini loop bands, cooling patch/recovery gel)"
        ),
        price=54.99,
        priority=86,
        default=False,
        requires_all=["goal_strength", "context_gym", "injury_knee_or_back"],
        requires_optional=["preference_low_impact", "preference_mobility"],
        excludes=[],
    )
    await create_offer(
        name="Run Your First 5K (Outdoor) — бігова програма",
        description=(
            "Digital: підготовка до 5K (3 рази/тиж)\n"
            "Physical wellness kit: Runner Starter Kit (electrolytes, reflective armband/safety light, "
            "blister kit, running belt)"
        ),
        price=44.99,
        priority=84,
        default=False,
        requires_all=["goal_endurance", "context_outdoor", "injury_none"],
        requires_optional=["preference_running", "level_beginner"],
        excludes=["injury_knee_or_back"],
    )
    await create_offer(
        name="Yoga & Mobility (Home) — гнучкість + спина/постава",
        description=(
            "Digital: йога/мобільність 10–25 хв\n"
            "Physical wellness kit: Mobility Kit (travel yoga mat або yoga strap, massage ball, "
            "mini foam roller)"
        ),
        price=39.99,
        priority=82,
        default=False,
        requires_all=["goal_flexibility", "context_home"],
        requires_optional=["preference_yoga", "preference_mobility"],
        excludes=[],
    )
    await create_offer(
        name="Stress Reset Program — ментальний ресет + мікрозвички",
        description=(
            "Digital: дихання/медитації/антистрес рутини\n"
            "Physical wellness kit: Calm-Now Kit (eye mask, aroma roll-on/mini candle, tea sticks, "
            "stress ball/fidget, quick reset card)"
        ),
        price=29.99,
        priority=70,
        default=True,
        requires_all=["stress_high"],
        requires_optional=["goal_stress", "preference_yoga"],
        excludes=[],
    )
    await create_offer(
        name="Quick Fit Micro-Workouts — 10–15 хв щодня",
        description=(
            "Digital: короткі щоденні тренування\n"
            "Physical wellness kit: Micro-Workout Kit (slider discs, mini loop bands, "
            "шейкер/пляшка, mini routine card)"
        ),
        price=34.99,
        priority=95,
        default=False,
        requires_all=["goal_weight_loss", "context_home", "time_10_15"],
        requires_optional=["preference_short_sessions", "level_beginner"],
        excludes=[],
    )

    flow = await Flow.create(
        name="Default Wellness Flow",
        is_active=True,
    )
    ordered_questions = [
        q_goal,
        q_context,
        q_time,
        q_injury,
        q_stress,
        q_level,
        q_preferences,
        q_final_text,
    ]
    for position, question in enumerate(ordered_questions, start=1):
        await FlowQuestion.create(
            flow=flow,
            question=question,
            position=position,
        )

    context_home_answer = q_context_answers["Вдома"]
    context_gym_answer = q_context_answers["У залі"]
    context_outdoor_answer = q_context_answers["На вулиці"]

    await FlowTransition.create(
        flow=flow,
        from_question=q_goal,
        to_question=q_context,
        condition_type="always",
        priority=10,
    )

    transition_context_to_time = await FlowTransition.create(
        flow=flow,
        from_question=q_context,
        to_question=q_time,
        condition_type="answer_any",
        priority=10,
    )
    await FlowTransitionAnswer.create(transition=transition_context_to_time, answer=context_home_answer)

    transition_context_to_injury = await FlowTransition.create(
        flow=flow,
        from_question=q_context,
        to_question=q_injury,
        condition_type="answer_any",
        priority=20,
    )
    await FlowTransitionAnswer.create(transition=transition_context_to_injury, answer=context_gym_answer)
    await FlowTransitionAnswer.create(transition=transition_context_to_injury, answer=context_outdoor_answer)

    await FlowTransition.create(
        flow=flow,
        from_question=q_time,
        to_question=q_injury,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_injury,
        to_question=q_stress,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_stress,
        to_question=q_level,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_level,
        to_question=q_preferences,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_preferences,
        to_question=q_final_text,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_final_text,
        to_question=None,
        condition_type="always",
        priority=10,
    )
