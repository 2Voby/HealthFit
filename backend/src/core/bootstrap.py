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
        "age_18_24",
        "age_25_34",
        "age_35_44",
        "age_45_plus",
        "gender_female",
        "gender_male",
        "gender_non_binary",
        "gender_not_specified",
        "goal_weight_loss",
        "goal_strength",
        "goal_flexibility",
        "goal_stress",
        "goal_endurance",
        "context_home",
        "context_gym",
        "context_outdoor",
        "equipment_none",
        "equipment_basic",
        "equipment_full_gym",
        "time_10_15",
        "time_20_30",
        "time_30_45",
        "injury_knee_or_back",
        "injury_none",
        "level_beginner",
        "level_intermediate",
        "level_advanced",
        "preference_strength",
        "preference_running",
        "preference_yoga",
        "preference_mobility",
        "preference_low_impact",
        "preference_short_sessions",
        "barrier_time",
        "barrier_stress",
        "barrier_fatigue",
        "barrier_discipline",
        "constraint_schedule_tight",
        "stress_low",
        "stress_medium",
        "stress_high",
        "sleep_poor",
        "sleep_ok",
        "sleep_good",
        "energy_low",
        "energy_mid",
        "energy_high",
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

    q_age, _ = await create_question_with_answers(
        text="Ваш вік?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("18–24", ["age_18_24"]),
            ("25–34", ["age_25_34"]),
            ("35–44", ["age_35_44"]),
            ("45+", ["age_45_plus"]),
        ],
    )
    q_gender, _ = await create_question_with_answers(
        text="Ваша стать?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Жіноча", ["gender_female"]),
            ("Чоловіча", ["gender_male"]),
            ("Інша", ["gender_non_binary"]),
            ("Не вказувати", ["gender_not_specified"]),
        ],
    )
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
    q_equipment, _ = await create_question_with_answers(
        text="Яке обладнання у вас є?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Без обладнання", ["equipment_none"]),
            ("Базовий набір (резинки/гантелі)", ["equipment_basic"]),
            ("Повний доступ до тренажерів", ["equipment_full_gym"]),
        ],
    )
    q_time, _ = await create_question_with_answers(
        text="Скільки часу на день?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("10–15 хв", ["time_10_15", "preference_short_sessions", "constraint_schedule_tight"]),
            ("20–30 хв", ["time_20_30"]),
            ("30–45 хв", ["time_30_45"]),
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
    q_barriers, _ = await create_question_with_answers(
        text="Що найчастіше заважає тренуватися?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Брак часу", ["barrier_time", "constraint_schedule_tight"]),
            ("Стрес", ["barrier_stress"]),
            ("Втома", ["barrier_fatigue"]),
            ("Брак дисципліни", ["barrier_discipline"]),
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
    q_sleep, _ = await create_question_with_answers(
        text="Як ви оцінюєте якість сну?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Погано", ["sleep_poor"]),
            ("Нормально", ["sleep_ok"]),
            ("Добре", ["sleep_good"]),
        ],
    )
    q_energy, _ = await create_question_with_answers(
        text="Рівень енергії протягом дня?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низький", ["energy_low"]),
            ("Середній", ["energy_mid"]),
            ("Високий", ["energy_high"]),
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
        name="Weight Loss Starter (Home) — 4 тижні",
        description=(
            "Digital: план схуднення вдома (20–30 хв)\n"
            "Physical wellness kit: Home Fat-Burn Kit (resistance bands, скакалка, "
            "шейкер/пляшка, електроліти + healthy snack)"
        ),
        price=49.99,
        priority=90,
        requires_all=["goal_weight_loss", "context_home", "time_20_30"],
        requires_optional=["level_beginner", "equipment_basic", "preference_short_sessions"],
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
        requires_all=["goal_strength", "context_gym", "injury_none"],
        requires_optional=["level_intermediate", "level_advanced", "preference_strength", "equipment_full_gym"],
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
        requires_all=["goal_strength", "context_gym", "injury_knee_or_back"],
        requires_optional=["preference_low_impact", "preference_mobility", "barrier_fatigue"],
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
        requires_all=["goal_endurance", "context_outdoor", "injury_none"],
        requires_optional=["preference_running", "level_beginner", "energy_mid", "energy_high"],
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
        requires_all=["goal_flexibility", "context_home"],
        requires_optional=["preference_yoga", "preference_mobility", "stress_medium", "stress_high"],
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
        requires_all=["stress_high"],
        requires_optional=["goal_stress", "sleep_poor", "energy_low", "barrier_stress"],
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
        requires_all=["goal_weight_loss", "context_home", "time_10_15"],
        requires_optional=["preference_short_sessions", "constraint_schedule_tight", "barrier_time"],
        excludes=[],
    )

    flow = await Flow.create(
        name="Default Wellness Flow",
        is_active=True,
    )
    ordered_questions = [
        q_age,
        q_gender,
        q_goal,
        q_context,
        q_equipment,
        q_time,
        q_injury,
        q_level,
        q_preferences,
        q_barriers,
        q_stress,
        q_sleep,
        q_energy,
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
        from_question=q_age,
        to_question=q_gender,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_gender,
        to_question=q_goal,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_goal,
        to_question=q_context,
        condition_type="always",
        priority=10,
    )

    transition_context_to_equipment = await FlowTransition.create(
        flow=flow,
        from_question=q_context,
        to_question=q_equipment,
        condition_type="answer_any",
        priority=10,
    )
    await FlowTransitionAnswer.create(transition=transition_context_to_equipment, answer=context_home_answer)

    transition_context_to_time = await FlowTransition.create(
        flow=flow,
        from_question=q_context,
        to_question=q_time,
        condition_type="answer_any",
        priority=20,
    )
    await FlowTransitionAnswer.create(transition=transition_context_to_time, answer=context_gym_answer)
    await FlowTransitionAnswer.create(transition=transition_context_to_time, answer=context_outdoor_answer)

    await FlowTransition.create(
        flow=flow,
        from_question=q_equipment,
        to_question=q_time,
        condition_type="always",
        priority=10,
    )
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
        to_question=q_barriers,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_barriers,
        to_question=q_stress,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_stress,
        to_question=q_sleep,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_sleep,
        to_question=q_energy,
        condition_type="always",
        priority=10,
    )
    await FlowTransition.create(
        flow=flow,
        from_question=q_energy,
        to_question=None,
        condition_type="always",
        priority=10,
    )
