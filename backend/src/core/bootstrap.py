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
        "Вік 18-24",
        "Вік 25-34",
        "Вік 35-44",
        "Вік 45+",
        "Стать: жінка",
        "Стать: чоловік",
        "Стать: non-binary",
        "Стать: не вказано",
        "Локація: вдома",
        "Локація: зал",
        "Локація: outdoors",
        "Обладнання вдома: немає",
        "Обладнання вдома: базове",
        "Обладнання вдома: повний набір",
        "Досвід у залі: новачок",
        "Досвід у залі: регулярний",
        "Досвід у залі: просунутий",
        "Outdoor формат: біг",
        "Outdoor формат: ходьба",
        "Outdoor формат: мікс",
        "Час на тренування: 10-15 хв",
        "Час на тренування: 20-30 хв",
        "Час на тренування: 30-45 хв",
        "Ціль: схуднення",
        "Ціль: сила",
        "Ціль: гнучкість",
        "Ціль: зниження стресу",
        "Ціль: витривалість",
        "Травми: так",
        "Травми: ні",
        "Травма: коліна",
        "Травма: спина",
        "Травма: інше",
        "Рівень: beginner",
        "Рівень: intermediate",
        "Рівень: advanced",
        "Бар'єр: брак часу",
        "Бар'єр: стрес",
        "Бар'єр: брак дисципліни",
        "Бар'єр: втома",
        "Преференс: силові",
        "Преференс: біг",
        "Преференс: йога",
        "Преференс: мобільність",
        "Преференс: low-impact",
        "Преференс: короткі сесії",
        "Інтенсивність: низька",
        "Інтенсивність: середня",
        "Інтенсивність: висока",
        "Графік: 2-3 рази/тиждень",
        "Графік: 4-5 разів/тиждень",
        "Графік: щодня",
        "Стрес: низький",
        "Стрес: середній",
        "Стрес: високий",
        "Сон: поганий",
        "Сон: нормальний",
        "Сон: добрий",
        "Енергія: низька",
        "Енергія: середня",
        "Енергія: висока",
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
            ("18–24", ["Вік 18-24"]),
            ("25–34", ["Вік 25-34"]),
            ("35–44", ["Вік 35-44"]),
            ("45+", ["Вік 45+"]),
        ],
    )
    q3, _ = await create_question_with_answers(
        text="Ваша стать?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Жінка", ["Стать: жінка"]),
            ("Чоловік", ["Стать: чоловік"]),
            ("Non-binary", ["Стать: non-binary"]),
            ("Не вказувати", ["Стать: не вказано"]),
        ],
    )
    q4, q4_answers = await create_question_with_answers(
        text="Де вам зручніше займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["Локація: вдома"]),
            ("У залі", ["Локація: зал"]),
            ("На вулиці", ["Локація: outdoors"]),
        ],
    )
    q5, _ = await create_question_with_answers(
        text="Яке обладнання у вас є вдома?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Немає", ["Обладнання вдома: немає"]),
            ("Базове (гантелі/резинки)", ["Обладнання вдома: базове"]),
            ("Повний сет", ["Обладнання вдома: повний набір"]),
        ],
    )
    q6, _ = await create_question_with_answers(
        text="Який у вас досвід тренувань у залі?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Новачок", ["Досвід у залі: новачок"]),
            ("Тренуюсь регулярно", ["Досвід у залі: регулярний"]),
            ("Просунутий рівень", ["Досвід у залі: просунутий"]),
        ],
    )
    q7, _ = await create_question_with_answers(
        text="Який outdoor формат вам ближчий?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Біг", ["Outdoor формат: біг", "Преференс: біг"]),
            ("Ходьба", ["Outdoor формат: ходьба"]),
            ("Мікс активностей", ["Outdoor формат: мікс"]),
        ],
    )
    q8, _ = await create_question_with_answers(
        text="Скільки часу на день ви готові виділяти?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("10–15 хв", ["Час на тренування: 10-15 хв", "Преференс: короткі сесії"]),
            ("20–30 хв", ["Час на тренування: 20-30 хв"]),
            ("30–45 хв", ["Час на тренування: 30-45 хв"]),
        ],
    )
    q9, _ = await create_question_with_answers(
        text="Яка ваша головна ціль?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Схуднення", ["Ціль: схуднення"]),
            ("Сила", ["Ціль: сила", "Преференс: силові"]),
            ("Гнучкість", ["Ціль: гнучкість", "Преференс: йога", "Преференс: мобільність"]),
            ("Зниження стресу", ["Ціль: зниження стресу"]),
            ("Витривалість", ["Ціль: витривалість"]),
        ],
    )
    q10, q10_answers = await create_question_with_answers(
        text="Чи є у вас травми або обмеження?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Так, є", ["Травми: так", "Преференс: low-impact"]),
            ("Ні, немає", ["Травми: ні"]),
        ],
    )
    q11, _ = await create_question_with_answers(
        text="Що саме турбує найбільше?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Коліна", ["Травма: коліна", "Преференс: low-impact"]),
            ("Спина", ["Травма: спина", "Преференс: low-impact"]),
            ("Інше", ["Травма: інше", "Преференс: low-impact"]),
        ],
    )
    q12, _ = await create_question_with_answers(
        text="Ваш поточний рівень підготовки?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Beginner", ["Рівень: beginner"]),
            ("Intermediate", ["Рівень: intermediate"]),
            ("Advanced", ["Рівень: advanced"]),
        ],
    )
    q13, _ = await create_question_with_answers(
        text="Що найчастіше заважає тренуватися регулярно?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Брак часу", ["Бар'єр: брак часу"]),
            ("Стрес", ["Бар'єр: стрес"]),
            ("Брак дисципліни", ["Бар'єр: брак дисципліни"]),
            ("Втома", ["Бар'єр: втома"]),
        ],
    )
    q14, _ = await create_question_with_answers(
        text="Який формат тренувань вам ближчий?",
        question_type="multiple_choise",
        requires=False,
        answers=[
            ("Силові", ["Преференс: силові"]),
            ("Біг", ["Преференс: біг"]),
            ("Йога", ["Преференс: йога"]),
            ("Мобільність/розтяжка", ["Преференс: мобільність"]),
            ("Low-impact", ["Преференс: low-impact"]),
            ("Короткі сесії", ["Преференс: короткі сесії"]),
        ],
    )
    q15, _ = await create_question_with_answers(
        text="Яку інтенсивність ви хочете?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низьку", ["Інтенсивність: низька"]),
            ("Середню", ["Інтенсивність: середня"]),
            ("Високу", ["Інтенсивність: висока"]),
        ],
    )
    q16, _ = await create_question_with_answers(
        text="Скільки тренувань на тиждень вам реально підходить?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("2–3", ["Графік: 2-3 рази/тиждень"]),
            ("4–5", ["Графік: 4-5 разів/тиждень"]),
            ("Щодня коротко", ["Графік: щодня", "Преференс: короткі сесії"]),
        ],
    )
    q17, _ = await create_question_with_answers(
        text="Ваш рівень стресу зараз?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Низький", ["Стрес: низький"]),
            ("Середній", ["Стрес: середній"]),
            ("Високий", ["Стрес: високий"]),
        ],
    )
    q18, _ = await create_question_with_answers(
        text="Як оцінюєте якість сну?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Погано", ["Сон: поганий"]),
            ("Нормально", ["Сон: нормальний"]),
            ("Добре", ["Сон: добрий"]),
        ],
    )
    q19, _ = await create_question_with_answers(
        text="Ваш рівень енергії протягом дня?",
        question_type="singe_choise",
        requires=False,
        answers=[
            ("Низький", ["Енергія: низька"]),
            ("Середній", ["Енергія: середня"]),
            ("Високий", ["Енергія: висока"]),
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
        requires_all=["Ціль: схуднення", "Локація: вдома", "Час на тренування: 20-30 хв"],
        requires_optional=["Рівень: beginner", "Преференс: короткі сесії"],
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
        requires_all=["Ціль: сила", "Локація: зал", "Травми: ні"],
        requires_optional=["Рівень: intermediate", "Рівень: advanced", "Преференс: силові"],
        excludes=["Травми: так"],
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
        requires_all=["Ціль: сила", "Локація: зал", "Травми: так"],
        requires_optional=["Преференс: low-impact", "Преференс: мобільність"],
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
        requires_all=["Ціль: витривалість", "Локація: outdoors", "Травми: ні"],
        requires_optional=["Преференс: біг", "Рівень: beginner"],
        excludes=["Травми: так"],
    )
    await create_offer(
        name="Yoga & Mobility (Home) — гнучкість + спина/постава",
        description="Digital: йога/мобільність 10–25 хв",
        wellness_kit_name="Mobility Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Mobility+Kit",
        wellness_kit_description="travel yoga mat або yoga strap, massage ball, mini foam roller",
        price=39.99,
        priority=82,
        default=False,
        requires_all=["Ціль: гнучкість", "Локація: вдома"],
        requires_optional=["Преференс: йога", "Преференс: мобільність"],
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
        requires_all=["Стрес: високий"],
        requires_optional=["Ціль: зниження стресу", "Сон: поганий", "Енергія: низька"],
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
        requires_all=["Ціль: схуднення", "Локація: вдома", "Час на тренування: 10-15 хв"],
        requires_optional=["Преференс: короткі сесії", "Рівень: beginner"],
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
