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
        "age:18_24",
        "age:25_34",
        "age:35_44",
        "age:45_plus",
        "gender:female",
        "gender:male",
        "gender:non_binary",
        "gender:prefer_not_say",
        "loc:home",
        "loc:gym",
        "loc:outdoor",
        "home_eq:none",
        "home_eq:basic",
        "home_eq:full",
        "gym_exp:new",
        "gym_exp:regular",
        "gym_exp:advanced",
        "outdoor:run",
        "outdoor:walk",
        "outdoor:mixed",
        "time:10_15",
        "time:20_30",
        "time:30_45",
        "goal:weight_loss",
        "goal:strength",
        "goal:flexibility",
        "goal:stress_relief",
        "goal:endurance",
        "injuries:yes",
        "injuries:no",
        "injury:knee",
        "injury:back",
        "injury:other",
        "level:beginner",
        "level:intermediate",
        "level:advanced",
        "barrier:time",
        "barrier:stress",
        "barrier:discipline",
        "barrier:fatigue",
        "pref:strength",
        "pref:running",
        "pref:yoga",
        "pref:mobility",
        "pref:low_impact",
        "pref:short_sessions",
        "intensity:low",
        "intensity:moderate",
        "intensity:high",
        "schedule:2_3",
        "schedule:4_5",
        "schedule:daily",
        "stress:low",
        "stress:medium",
        "stress:high",
        "sleep:poor",
        "sleep:ok",
        "sleep:good",
        "energy:low",
        "energy:medium",
        "energy:high",
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

    q1, _ = await create_question_with_answers(
        text="Ласкаво просимо до персонального wellness-підбору. Відповіді займуть до 2 хвилин.",
        question_type="text",
        requires=False,
        answers=[],
    )
    q2, _ = await create_question_with_answers(
        text="Ваш вік?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("18–24", ["age:18_24"]),
            ("25–34", ["age:25_34"]),
            ("35–44", ["age:35_44"]),
            ("45+", ["age:45_plus"]),
        ],
    )
    q3, _ = await create_question_with_answers(
        text="Ваша стать?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Жінка", ["gender:female"]),
            ("Чоловік", ["gender:male"]),
            ("Non-binary", ["gender:non_binary"]),
            ("Не вказувати", ["gender:prefer_not_say"]),
        ],
    )
    q4, q4_answers = await create_question_with_answers(
        text="Де вам зручніше займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["loc:home"]),
            ("У залі", ["loc:gym"]),
            ("На вулиці", ["loc:outdoor"]),
        ],
    )
    q5, _ = await create_question_with_answers(
        text="Яке обладнання у вас є вдома?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Немає", ["home_eq:none"]),
            ("Базове (гантелі/резинки)", ["home_eq:basic"]),
            ("Повний сет", ["home_eq:full"]),
        ],
    )
    q6, _ = await create_question_with_answers(
        text="Який у вас досвід тренувань у залі?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Новачок", ["gym_exp:new"]),
            ("Тренуюсь регулярно", ["gym_exp:regular"]),
            ("Просунутий рівень", ["gym_exp:advanced"]),
        ],
    )
    q7, _ = await create_question_with_answers(
        text="Який outdoor формат вам ближчий?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Біг", ["outdoor:run", "pref:running"]),
            ("Ходьба", ["outdoor:walk"]),
            ("Мікс активностей", ["outdoor:mixed"]),
        ],
    )
    q8, _ = await create_question_with_answers(
        text="Скільки часу на день ви готові виділяти?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("10–15 хв", ["time:10_15", "pref:short_sessions"]),
            ("20–30 хв", ["time:20_30"]),
            ("30–45 хв", ["time:30_45"]),
        ],
    )
    q9, _ = await create_question_with_answers(
        text="Яка ваша головна ціль?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Схуднення", ["goal:weight_loss"]),
            ("Сила", ["goal:strength", "pref:strength"]),
            ("Гнучкість", ["goal:flexibility", "pref:yoga", "pref:mobility"]),
            ("Зниження стресу", ["goal:stress_relief"]),
            ("Витривалість", ["goal:endurance"]),
        ],
    )
    q10, q10_answers = await create_question_with_answers(
        text="Чи є у вас травми або обмеження?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Так, є", ["injuries:yes", "pref:low_impact"]),
            ("Ні, немає", ["injuries:no"]),
        ],
    )
    q11, _ = await create_question_with_answers(
        text="Що саме турбує найбільше?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Коліна", ["injury:knee", "pref:low_impact"]),
            ("Спина", ["injury:back", "pref:low_impact"]),
            ("Інше", ["injury:other", "pref:low_impact"]),
        ],
    )
    q12, _ = await create_question_with_answers(
        text="Ваш поточний рівень підготовки?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Beginner", ["level:beginner"]),
            ("Intermediate", ["level:intermediate"]),
            ("Advanced", ["level:advanced"]),
        ],
    )
    q13, _ = await create_question_with_answers(
        text="Що найчастіше заважає тренуватися регулярно?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Брак часу", ["barrier:time"]),
            ("Стрес", ["barrier:stress"]),
            ("Брак дисципліни", ["barrier:discipline"]),
            ("Втома", ["barrier:fatigue"]),
        ],
    )
    q14, _ = await create_question_with_answers(
        text="Який формат тренувань вам ближчий?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Силові", ["pref:strength"]),
            ("Біг", ["pref:running"]),
            ("Йога", ["pref:yoga"]),
            ("Мобільність/розтяжка", ["pref:mobility"]),
            ("Low-impact", ["pref:low_impact"]),
            ("Короткі сесії", ["pref:short_sessions"]),
        ],
    )
    q15, _ = await create_question_with_answers(
        text="Яку інтенсивність ви хочете?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низьку", ["intensity:low"]),
            ("Середню", ["intensity:moderate"]),
            ("Високу", ["intensity:high"]),
        ],
    )
    q16, _ = await create_question_with_answers(
        text="Скільки тренувань на тиждень вам реально підходить?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("2–3", ["schedule:2_3"]),
            ("4–5", ["schedule:4_5"]),
            ("Щодня коротко", ["schedule:daily", "pref:short_sessions"]),
        ],
    )
    q17, _ = await create_question_with_answers(
        text="Ваш рівень стресу зараз?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Низький", ["stress:low"]),
            ("Середній", ["stress:medium"]),
            ("Високий", ["stress:high"]),
        ],
    )
    q18, _ = await create_question_with_answers(
        text="Як оцінюєте якість сну?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Погано", ["sleep:poor"]),
            ("Нормально", ["sleep:ok"]),
            ("Добре", ["sleep:good"]),
        ],
    )
    q19, _ = await create_question_with_answers(
        text="Ваш рівень енергії протягом дня?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низький", ["energy:low"]),
            ("Середній", ["energy:medium"]),
            ("Високий", ["energy:high"]),
        ],
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
        requires_all=["goal:weight_loss", "loc:home", "time:20_30"],
        requires_optional=["level:beginner", "pref:short_sessions"],
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
        requires_all=["goal:strength", "loc:gym", "injuries:no"],
        requires_optional=["level:intermediate", "level:advanced", "pref:strength"],
        excludes=["injuries:yes"],
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
        requires_all=["goal:strength", "loc:gym", "injuries:yes"],
        requires_optional=["pref:low_impact", "pref:mobility"],
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
        requires_all=["goal:endurance", "loc:outdoor", "injuries:no"],
        requires_optional=["pref:running", "level:beginner"],
        excludes=["injuries:yes"],
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
        requires_all=["goal:flexibility", "loc:home"],
        requires_optional=["pref:yoga", "pref:mobility"],
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
        requires_all=["stress:high"],
        requires_optional=["goal:stress_relief", "sleep:poor", "energy:low"],
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
        requires_all=["goal:weight_loss", "loc:home", "time:10_15"],
        requires_optional=["pref:short_sessions", "level:beginner"],
        excludes=[],
    )

    flow = await Flow.create(
        name="Default Wellness Flow",
        is_active=True,
    )
    ordered_questions = [
        q1,
        q2,
        q3,
        q4,
        q5,
        q6,
        q7,
        q8,
        q9,
        q10,
        q11,
        q12,
        q13,
        q14,
        q15,
        q16,
        q17,
        q18,
        q19,
    ]
    for position, question in enumerate(ordered_questions, start=1):
        await FlowQuestion.create(
            flow=flow,
            question=question,
            position=position,
        )

    loc_home_answer = q4_answers["Вдома"]
    loc_gym_answer = q4_answers["У залі"]
    loc_outdoor_answer = q4_answers["На вулиці"]
    injuries_yes_answer = q10_answers["Так, є"]
    injuries_no_answer = q10_answers["Ні, немає"]

    async def create_transition(
        from_question: Question,
        to_question: Question | None,
        condition_type: str,
        priority: int,
        answers: list[QuestionAnswer] | None = None,
    ) -> None:
        transition = await FlowTransition.create(
            flow=flow,
            from_question=from_question,
            to_question=to_question,
            condition_type=condition_type,
            priority=priority,
        )
        for answer in answers or []:
            await FlowTransitionAnswer.create(transition=transition, answer=answer)

    await create_transition(q1, q2, "always", 10)
    await create_transition(q2, q3, "always", 10)
    await create_transition(q3, q4, "always", 10)

    await create_transition(q4, q5, "answer_any", 10, [loc_home_answer])
    await create_transition(q4, q6, "answer_any", 20, [loc_gym_answer])
    await create_transition(q4, q7, "answer_any", 30, [loc_outdoor_answer])

    await create_transition(q5, q8, "always", 10)
    await create_transition(q6, q8, "always", 10)
    await create_transition(q7, q8, "always", 10)

    await create_transition(q8, q9, "always", 10)
    await create_transition(q9, q10, "always", 10)

    await create_transition(q10, q11, "answer_any", 10, [injuries_yes_answer])
    await create_transition(q10, q12, "answer_any", 20, [injuries_no_answer])
    await create_transition(q11, q12, "always", 10)

    await create_transition(q12, q13, "always", 10)
    await create_transition(q13, q14, "always", 10)
    await create_transition(q14, q15, "always", 10)
    await create_transition(q15, q16, "always", 10)
    await create_transition(q16, q17, "always", 10)
    await create_transition(q17, q18, "always", 10)
    await create_transition(q18, q19, "always", 10)
    await create_transition(q19, None, "always", 10)
