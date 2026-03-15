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
        "age:18-24",
        "age:25-34",
        "age:35-44",
        "age:45-plus",
        "gender:female",
        "gender:male",
        "gender:unspecified",
        "location:home",
        "location:gym",
        "location:outdoor",
        "home-equipment:none",
        "home-equipment:basic",
        "home-equipment:full",
        "gym-experience:beginner",
        "gym-experience:regular",
        "gym-experience:advanced",
        "outdoor-format:running",
        "outdoor-format:walking",
        "outdoor-format:mixed",
        "workout-time:10-15-min",
        "workout-time:20-30-min",
        "workout-time:30-45-min",
        "goal:weight-loss",
        "goal:strength",
        "goal:flexibility",
        "goal:stress-relief",
        "goal:endurance",
        "injuries:yes",
        "injuries:no",
        "injury:knees",
        "injury:back",
        "injury:neck",
        "injury:shoulders",
        "injury:wrists",
        "injury:hips",
        "injury:ankles",
        "injury:other",
        "level:beginner",
        "level:intermediate",
        "level:advanced",
        "barrier:lack-of-time",
        "barrier:stress",
        "barrier:lack-of-discipline",
        "barrier:fatigue",
        "preference:strength",
        "preference:running",
        "preference:yoga",
        "preference:mobility",
        "preference:low-impact",
        "preference:short-sessions",
        "intensity:low",
        "intensity:medium",
        "intensity:high",
        "schedule:2-3-per-week",
        "schedule:4-5-per-week",
        "schedule:daily",
        "stress:low",
        "stress:medium",
        "stress:high",
        "sleep:poor",
        "sleep:normal",
        "sleep:good",
        "energy:low",
        "energy:medium",
        "energy:high",
    ]
    attributes_by_name: dict[str, Attribute] = {}
    for attribute_name in attribute_names:
        attribute = await Attribute.create(name=attribute_name)
        attributes_by_name[attribute_name] = attribute

    async def create_question_with_answers(
        text: str,
        question_type: str,
        requires: bool,
        answers: list[tuple[str, list[str]]],
        manual_input_type: str | None = None,
        manual_input_min: int | None = None,
        manual_input_max: int | None = None,
    ) -> tuple[Question, dict[str, QuestionAnswer]]:
        question = await Question.create(
            text=text,
            type=question_type,
            manual_input_type=manual_input_type,
            manual_input_min=manual_input_min,
            manual_input_max=manual_input_max,
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
        question_type="manual_input",
        requires=True,
        answers=[
            ("18-24", ["age:18-24"]),
            ("25-34", ["age:25-34"]),
            ("35-44", ["age:35-44"]),
            ("45+", ["age:45-plus"]),
        ],
        manual_input_type="number",
        manual_input_min=18,
        manual_input_max=100,
    )
    q3, _ = await create_question_with_answers(
        text="Ваш зріст (см)?",
        question_type="manual_input",
        requires=True,
        answers=[],
        manual_input_type="number",
        manual_input_min=120,
        manual_input_max=220,
    )
    q4, _ = await create_question_with_answers(
        text="Ваша стать?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Жінка", ["gender:female"]),
            ("Чоловік", ["gender:male"]),
            ("Не вказувати", ["gender:unspecified"]),
        ],
    )
    q5, q5_answers = await create_question_with_answers(
        text="Де вам зручніше займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["location:home"]),
            ("У залі", ["location:gym"]),
            ("На вулиці", ["location:outdoor"]),
        ],
    )
    q6, _ = await create_question_with_answers(
        text="Яке обладнання у вас є вдома?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Немає", ["home-equipment:none"]),
            ("Базове (гантелі/резинки)", ["home-equipment:basic"]),
            ("Повний сет", ["home-equipment:full"]),
        ],
    )
    q7, _ = await create_question_with_answers(
        text="Який у вас досвід тренувань у залі?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Новачок", ["gym-experience:beginner"]),
            ("Тренуюсь регулярно", ["gym-experience:regular"]),
            ("Просунутий рівень", ["gym-experience:advanced"]),
        ],
    )
    q8, _ = await create_question_with_answers(
        text="Який outdoor формат вам ближчий?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Біг", ["outdoor-format:running", "preference:running"]),
            ("Ходьба", ["outdoor-format:walking"]),
            ("Мікс активностей", ["outdoor-format:mixed"]),
        ],
    )
    q9, _ = await create_question_with_answers(
        text="Скільки часу на день ви готові виділяти?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("10–15 хв", ["workout-time:10-15-min", "preference:short-sessions"]),
            ("20–30 хв", ["workout-time:20-30-min"]),
            ("30–45 хв", ["workout-time:30-45-min"]),
        ],
    )
    q10, _ = await create_question_with_answers(
        text="Яка ваша головна ціль?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Схуднення", ["goal:weight-loss"]),
            ("Сила", ["goal:strength", "preference:strength"]),
            ("Гнучкість", ["goal:flexibility", "preference:yoga", "preference:mobility"]),
            ("Зниження стресу", ["goal:stress-relief"]),
            ("Витривалість", ["goal:endurance"]),
        ],
    )
    q11, q11_answers = await create_question_with_answers(
        text="Чи є у вас травми або обмеження?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Так, є", ["injuries:yes", "preference:low-impact"]),
            ("Ні, немає", ["injuries:no"]),
        ],
    )
    q12, _ = await create_question_with_answers(
        text="Що саме турбує найбільше?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Коліна", ["injury:knees", "preference:low-impact"]),
            ("Спина", ["injury:back", "preference:low-impact"]),
            ("Шия", ["injury:neck", "preference:low-impact"]),
            ("Плечі", ["injury:shoulders", "preference:low-impact"]),
            ("Зап'ястя", ["injury:wrists", "preference:low-impact"]),
            ("Таз/стегна", ["injury:hips", "preference:low-impact"]),
            ("Гомілкостоп", ["injury:ankles", "preference:low-impact"]),
            ("Інше", ["injury:other", "preference:low-impact"]),
        ],
    )
    q13, _ = await create_question_with_answers(
        text="Ваш поточний рівень підготовки?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Beginner", ["level:beginner"]),
            ("Intermediate", ["level:intermediate"]),
            ("Advanced", ["level:advanced"]),
        ],
    )
    q14, _ = await create_question_with_answers(
        text="Що найчастіше заважає тренуватися регулярно?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Брак часу", ["barrier:lack-of-time"]),
            ("Стрес", ["barrier:stress"]),
            ("Брак дисципліни", ["barrier:lack-of-discipline"]),
            ("Втома", ["barrier:fatigue"]),
        ],
    )
    q15, _ = await create_question_with_answers(
        text="Який формат тренувань вам ближчий?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Силові", ["preference:strength"]),
            ("Біг", ["preference:running"]),
            ("Йога", ["preference:yoga"]),
            ("Мобільність/розтяжка", ["preference:mobility"]),
            ("Low-impact", ["preference:low-impact"]),
            ("Короткі сесії", ["preference:short-sessions"]),
        ],
    )
    q16, _ = await create_question_with_answers(
        text="Яку інтенсивність ви хочете?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низьку", ["intensity:low"]),
            ("Середню", ["intensity:medium"]),
            ("Високу", ["intensity:high"]),
        ],
    )
    q17, _ = await create_question_with_answers(
        text="Скільки тренувань на тиждень вам реально підходить?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("2–3", ["schedule:2-3-per-week"]),
            ("4–5", ["schedule:4-5-per-week"]),
            ("Щодня коротко", ["schedule:daily", "preference:short-sessions"]),
        ],
    )
    q18, _ = await create_question_with_answers(
        text="Ваш рівень стресу зараз?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Низький", ["stress:low"]),
            ("Середній", ["stress:medium"]),
            ("Високий", ["stress:high"]),
        ],
    )
    q19, _ = await create_question_with_answers(
        text="Як оцінюєте якість сну?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Погано", ["sleep:poor"]),
            ("Нормально", ["sleep:normal"]),
            ("Добре", ["sleep:good"]),
        ],
    )
    q20, _ = await create_question_with_answers(
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
        wellness_kit_name: str,
        wellness_kit_image_url: str,
        wellness_kit_description: str,
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
            wellness_kit_name=wellness_kit_name,
            wellness_kit_image_url=wellness_kit_image_url,
            wellness_kit_description=wellness_kit_description,
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
        description="Digital: план схуднення вдома (20–30 хв)",
        wellness_kit_name="Home Fat-Burn Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Home+Fat-Burn+Kit",
        wellness_kit_description="resistance bands, скакалка, шейкер/пляшка, електроліти + healthy snack",
        price=49.99,
        priority=90,
        default=False,
        requires_all=["goal:weight-loss", "location:home", "workout-time:20-30-min"],
        requires_optional=["level:beginner", "preference:short-sessions"],
        excludes=[],
    )
    await create_offer(
        name="Lean Strength Builder (Gym) — силові + прогресія",
        description="Digital: програма для залу",
        wellness_kit_name="Gym Support Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Gym+Support+Kit",
        wellness_kit_description="wrist wraps/straps, mini loop band, компактний рушник, електроліти/протеїн-снек",
        price=59.99,
        priority=88,
        default=False,
        requires_all=["goal:strength", "location:gym", "injuries:no"],
        requires_optional=["level:intermediate", "level:advanced", "preference:strength"],
        excludes=["injuries:yes"],
    )
    await create_offer(
        name="Low-Impact Fat Burn — “суглоби friendly”",
        description="Digital: low-impact план (коліна/спина friendly)",
        wellness_kit_name="Joint-Friendly Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Joint-Friendly+Kit",
        wellness_kit_description="knee sleeve/бандаж, massage ball, mini loop bands, cooling patch/recovery gel",
        price=54.99,
        priority=86,
        default=False,
        requires_all=["goal:strength", "location:gym", "injuries:yes"],
        requires_optional=["preference:low-impact", "preference:mobility"],
        excludes=[],
    )
    await create_offer(
        name="Run Your First 5K (Outdoor) — бігова програма",
        description="Digital: підготовка до 5K (3 рази/тиж)",
        wellness_kit_name="Runner Starter Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Runner+Starter+Kit",
        wellness_kit_description="electrolytes, reflective armband/safety light, blister kit, running belt",
        price=44.99,
        priority=84,
        default=False,
        requires_all=["goal:endurance", "location:outdoor", "injuries:no"],
        requires_optional=["preference:running", "level:beginner"],
        excludes=["injuries:yes"],
    )
    await create_offer(
        name="Yoga & Mobility (Home) — гнучкість + спина/постава",
        description="Digital: йога/мобільність 10–25 хв",
        wellness_kit_name="Mobility Kit",
        wellness_kit_image_url="https://store.betterme.world/uk/products/recovery-essential-kit?srsltid=AfmBOoq7PrNhNJ7B7HlFI4q6iJRmxAPCyfM2MnCoxVbCYyoh8J2VOBTf",
        wellness_kit_description="travel yoga mat або yoga strap, massage ball, mini foam roller",
        price=39.99,
        priority=82,
        default=False,
        requires_all=["goal:flexibility", "location:home"],
        requires_optional=["preference:yoga", "preference:mobility"],
        excludes=[],
    )
    await create_offer(
        name="Stress Reset Program — ментальний ресет + мікрозвички",
        description="Digital: дихання/медитації/антистрес рутини",
        wellness_kit_name="Calm-Now Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Calm-Now+Kit",
        wellness_kit_description="eye mask, aroma roll-on/mini candle, tea sticks, stress ball/fidget, quick reset card",
        price=29.99,
        priority=70,
        default=True,
        requires_all=["stress:high"],
        requires_optional=["goal:stress-relief", "sleep:poor", "energy:low"],
        excludes=[],
    )
    await create_offer(
        name="Quick Fit Micro-Workouts — 10–15 хв щодня",
        description="Digital: короткі щоденні тренування",
        wellness_kit_name="Micro-Workout Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Micro-Workout+Kit",
        wellness_kit_description="slider discs, mini loop bands, шейкер/пляшка, mini routine card",
        price=34.99,
        priority=95,
        default=False,
        requires_all=["goal:weight-loss", "location:home", "workout-time:10-15-min"],
        requires_optional=["preference:short-sessions", "level:beginner"],
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
        q20,
    ]
    for position, question in enumerate(ordered_questions, start=1):
        await FlowQuestion.create(
            flow=flow,
            question=question,
            position=position,
        )

    loc_home_answer = q5_answers["Вдома"]
    loc_gym_answer = q5_answers["У залі"]
    loc_outdoor_answer = q5_answers["На вулиці"]
    injuries_yes_answer = q11_answers["Так, є"]
    injuries_no_answer = q11_answers["Ні, немає"]

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
    await create_transition(q4, q5, "always", 10)

    await create_transition(q5, q6, "answer_any", 10, [loc_home_answer])
    await create_transition(q5, q7, "answer_any", 20, [loc_gym_answer])
    await create_transition(q5, q8, "answer_any", 30, [loc_outdoor_answer])

    await create_transition(q6, q9, "always", 10)
    await create_transition(q7, q9, "always", 10)
    await create_transition(q8, q9, "always", 10)

    await create_transition(q9, q10, "always", 10)
    await create_transition(q10, q11, "always", 10)

    await create_transition(q11, q12, "answer_any", 10, [injuries_yes_answer])
    await create_transition(q11, q13, "answer_any", 20, [injuries_no_answer])
    await create_transition(q12, q13, "always", 10)

    await create_transition(q13, q14, "always", 10)
    await create_transition(q14, q15, "always", 10)
    await create_transition(q15, q16, "always", 10)
    await create_transition(q16, q17, "always", 10)
    await create_transition(q17, q18, "always", 10)
    await create_transition(q18, q19, "always", 10)
    await create_transition(q19, q20, "always", 10)
    await create_transition(q20, None, "always", 10)
