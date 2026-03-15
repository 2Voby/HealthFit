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
        "goal:weight-loss",
        "goal:muscle-gain",
        "goal:run-5k",
        "goal:mobility",
        "goal:stress-reset",
        "age:14-17",
        "age:18-24",
        "age:25-34",
        "age:35-44",
        "age:45-plus",
        "training-experience:zero",
        "training-experience:returning",
        "training-experience:regular",
        "location:home",
        "location:gym",
        "location:outdoor",
        "location:treadmill",
        "location:mixed",
        "location:office",
        "location:anywhere",
        "limitation:none",
        "limitation:knees",
        "limitation:back",
        "limitation:pregnancy-postpartum",
        "limitation:joint-weakness",
        "limitation:multiple",
        "frequency:2-per-week",
        "frequency:3-4-per-week",
        "frequency:5-6-per-week",
        "duration:5-10-min",
        "duration:15-min",
        "duration:15-20-min",
        "duration:20-30-min",
        "duration:30-plus-min",
        "duration:30-60-min",
        "priority:fat-loss-strength",
        "priority:max-muscle",
        "priority:balanced",
        "pain-area:knees",
        "pain-area:back",
        "pain-area:joints",
        "pain-area:multiple",
        "rehab:doctor-guidance",
        "rehab:cautious",
        "rehab:needs-assessment",
        "running-experience:none",
        "running-experience:returning",
        "running-experience:occasional",
        "running-goal:finish-5k",
        "running-goal:sub-30",
        "running-goal:event",
        "mobility-focus:posture",
        "mobility-focus:hips-legs",
        "mobility-focus:general",
        "mobility-focus:sleep-recovery",
        "yoga-experience:beginner",
        "yoga-experience:occasional",
        "yoga-experience:regular",
        "practice-time:morning",
        "practice-time:evening",
        "practice-time:flexible",
        "stress-state:anxious",
        "stress-state:poor-sleep",
        "stress-state:burnout",
        "stress-state:mental-overload",
        "activity:none",
        "activity:light",
        "activity:regular",
        "micro-goal:fat-burn",
        "micro-goal:tone",
        "micro-goal:stress-relief",
        "offer-track:low-impact",
        "offer-track:running",
        "offer-track:yoga-mobility",
        "offer-track:stress-reset",
        "offer-track:micro",
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

    age_answers = [
        ("14-17", ["age:14-17"]),
        ("18-24", ["age:18-24"]),
        ("25-34", ["age:25-34"]),
        ("35-44", ["age:35-44"]),
        ("45+", ["age:45-plus"]),
    ]
    training_experience_answers = [
        ("Починаю з нуля — раніше майже не тренувався(лась)", ["training-experience:zero"]),
        ("Тренувався(лась), але давно кинув(ла)", ["training-experience:returning"]),
        ("Займаюся регулярно (3+ рази на тиждень)", ["training-experience:regular"]),
    ]
    physical_limitations_answers = [
        ("Болять коліна або суглоби", ["limitation:knees"]),
        ("Проблеми зі спиною або поперек", ["limitation:back"]),
        ("Вагітність або післяпологовий період", ["limitation:pregnancy-postpartum"]),
        ("Немає обмежень — все ок", ["limitation:none"]),
    ]
    duration_with_micro_answers = [
        ("До 15 хв", ["duration:15-min", "offer-track:micro"]),
        ("20–30 хвилин", ["duration:20-30-min"]),
        ("30–60 хвилин", ["duration:30-60-min"]),
    ]

    async def create_age_question() -> tuple[Question, dict[str, QuestionAnswer]]:
        return await create_question_with_answers(
            text="Скільки тобі років?",
            question_type="manual_input",
            requires=True,
            answers=age_answers,
            manual_input_type="number",
            manual_input_min=14,
            manual_input_max=75,
        )

    async def create_training_experience_question() -> tuple[Question, dict[str, QuestionAnswer]]:
        return await create_question_with_answers(
            text="Який у тебе досвід фізичних навантажень?",
            question_type="singe_choise",
            requires=True,
            answers=training_experience_answers,
        )

    async def create_physical_limitations_question() -> tuple[Question, dict[str, QuestionAnswer]]:
        return await create_question_with_answers(
            text="Чи є у тебе фізичні обмеження?",
            question_type="multiple_choise",
            requires=True,
            answers=physical_limitations_answers,
        )

    q1, q1_answers = await create_question_with_answers(
        text="Яка твоя головна мета прямо зараз?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Схуднути та спалити жир", ["goal:weight-loss"]),
            ("Набрати м'язи та рельєф", ["goal:muscle-gain"]),
            ("Почати бігати / підготуватися до 5K", ["goal:run-5k"]),
            ("Гнучкість, постава, мобільність", ["goal:mobility"]),
            ("Знизити стрес, відновитися", ["goal:stress-reset"]),
        ],
    )

    q2a, _ = await create_age_question()
    q3a, _ = await create_training_experience_question()
    q4a, _ = await create_question_with_answers(
        text="Де плануєш тренуватися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома — без залу або мінімум обладнання", ["location:home"]),
            ("У залі — є доступ до тренажерів", ["location:gym"]),
            ("На вулиці / у дворі", ["location:outdoor"]),
        ],
    )
    q5a, q5a_answers = await create_physical_limitations_question()
    q6a, _ = await create_question_with_answers(
        text="Скільки разів на тиждень ти реально готовий(а) тренуватися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("2 рази", ["frequency:2-per-week"]),
            ("3–4 рази", ["frequency:3-4-per-week"]),
            ("5–6 разів (кожен день)", ["frequency:5-6-per-week"]),
        ],
    )
    q7a, q7a_answers = await create_question_with_answers(
        text="Скільки хвилин готовий(а) приділяти одному тренуванню?",
        question_type="singe_choise",
        requires=True,
        answers=duration_with_micro_answers,
    )

    q2b, _ = await create_age_question()
    q3b, _ = await create_training_experience_question()
    q4b, _ = await create_question_with_answers(
        text="Де плануєш тренуватися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["location:home"]),
            ("У залі", ["location:gym"]),
        ],
    )
    q5b, _ = await create_question_with_answers(
        text="Що для тебе важливіше зараз?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Зменшити жир + стати сильнішим(ою)", ["priority:fat-loss-strength"]),
            ("Максимально наростити м'язи", ["priority:max-muscle"]),
            ("Рівновага — і те, і інше", ["priority:balanced"]),
        ],
    )
    q6b, q6b_answers = await create_physical_limitations_question()
    q7b, q7b_answers = await create_question_with_answers(
        text="Скільки хвилин готовий(а) приділяти одному тренуванню?",
        question_type="singe_choise",
        requires=True,
        answers=duration_with_micro_answers,
    )

    q4c, _ = await create_question_with_answers(
        text="Що турбує найбільше?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Коліна — важко присідати, стрибати", ["pain-area:knees", "offer-track:low-impact"]),
            ("Спина/поперек — важко нахилятися", ["pain-area:back", "offer-track:low-impact"]),
            ("Загальна слабкість суглобів", ["pain-area:joints", "limitation:joint-weakness", "offer-track:low-impact"]),
            ("Все перераховане", ["pain-area:multiple", "limitation:multiple", "offer-track:low-impact"]),
        ],
    )
    q5c, _ = await create_question_with_answers(
        text="Ти зараз проходиш лікування або реабілітацію?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Так, є рекомендації лікаря", ["rehab:doctor-guidance", "offer-track:low-impact"]),
            ("Ні, просто обережно ставлюся", ["rehab:cautious", "offer-track:low-impact"]),
            ("Не знаю — хочу дізнатися що підходить", ["rehab:needs-assessment", "offer-track:low-impact"]),
        ],
    )
    q6c, _ = await create_question_with_answers(
        text="Скільки хвилин готовий(а) приділяти одному тренуванню?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("20–30 хвилин", ["duration:20-30-min", "offer-track:low-impact"]),
            ("30–60 хвилин", ["duration:30-60-min", "offer-track:low-impact"]),
        ],
    )

    q2e, _ = await create_age_question()
    q3e, _ = await create_training_experience_question()
    q4e, _ = await create_question_with_answers(
        text="Який у тебе досвід бігу?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Ніколи не бігав(ла) регулярно", ["running-experience:none", "offer-track:running"]),
            ("Бігав(ла) раніше, хочу повернутися", ["running-experience:returning", "offer-track:running"]),
            ("Бігаю іноді, хочу підготуватися до забігу", ["running-experience:occasional", "offer-track:running"]),
        ],
    )
    q5e, _ = await create_question_with_answers(
        text="Де плануєш тренуватися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("На вулиці — парк, стадіон", ["location:outdoor", "offer-track:running"]),
            ("Бігова доріжка в залі", ["location:treadmill", "offer-track:running"]),
            ("Комбінація", ["location:mixed", "offer-track:running"]),
        ],
    )
    q6e, _ = await create_question_with_answers(
        text="Яка твоя ціль?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Просто пробігти 5K без зупинки", ["running-goal:finish-5k", "offer-track:running"]),
            ("Пробігти за конкретний час (до 30 хв)", ["running-goal:sub-30", "offer-track:running"]),
            ("Взяти участь у забігу / зареєструватися", ["running-goal:event", "offer-track:running"]),
        ],
    )
    q7e, _ = await create_question_with_answers(
        text="Чи є у тебе фізичні обмеження?",
        question_type="multiple_choise",
        requires=True,
        answers=physical_limitations_answers,
    )

    q2f, _ = await create_age_question()
    q3f, _ = await create_training_experience_question()
    q4f, _ = await create_question_with_answers(
        text="Що хочеш покращити?",
        question_type="multiple_choise",
        requires=True,
        answers=[
            ("Спина та постава", ["mobility-focus:posture", "offer-track:yoga-mobility"]),
            ("Гнучкість ніг та тазу", ["mobility-focus:hips-legs", "offer-track:yoga-mobility"]),
            ("Загальна рухливість", ["mobility-focus:general", "offer-track:yoga-mobility"]),
            ("Якість сну та відновлення", ["mobility-focus:sleep-recovery", "offer-track:yoga-mobility"]),
        ],
    )
    q5f, _ = await create_question_with_answers(
        text="Чи є досвід йоги або розтяжки?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Ні, повний новачок(чиня)", ["yoga-experience:beginner", "offer-track:yoga-mobility"]),
            ("Займався(лась) іноді", ["yoga-experience:occasional", "offer-track:yoga-mobility"]),
            ("Регулярна практика, хочу більше структури", ["yoga-experience:regular", "offer-track:yoga-mobility"]),
        ],
    )
    q6f, _ = await create_question_with_answers(
        text="Коли плануєш займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вранці — для заряду", ["practice-time:morning", "offer-track:yoga-mobility"]),
            ("Ввечері — для розслаблення", ["practice-time:evening", "offer-track:yoga-mobility"]),
            ("Різний час", ["practice-time:flexible", "offer-track:yoga-mobility"]),
        ],
    )

    q2g, _ = await create_age_question()
    q3g, _ = await create_training_experience_question()
    q4g, _ = await create_question_with_answers(
        text="Що з цього тебе описує зараз?",
        question_type="multiple_choise",
        requires=True,
        answers=[
            ("Постійно на нервах, важко заспокоїтися", ["stress-state:anxious", "offer-track:stress-reset"]),
            ("Погано сплю, прокидаюся втомленим(ою)", ["stress-state:poor-sleep", "offer-track:stress-reset"]),
            ("Відчуваю вигорання — немає сил ні на що", ["stress-state:burnout", "offer-track:stress-reset"]),
            ("Тіло ок, але голова перевантажена", ["stress-state:mental-overload", "offer-track:stress-reset"]),
        ],
    )
    q5g, _ = await create_question_with_answers(
        text="Чи займаєшся зараз якоюсь активністю?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Ні, зовсім не рухаюся", ["activity:none", "offer-track:stress-reset"]),
            ("Іноді — прогулянки, йога", ["activity:light", "offer-track:stress-reset"]),
            ("Так, тренуюся але відчуваю стрес", ["activity:regular", "offer-track:stress-reset"]),
        ],
    )
    q6g, _ = await create_question_with_answers(
        text="Скільки хвилин на день готовий(а) виділити на себе?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("5–10 хвилин — мінімум", ["duration:5-10-min", "offer-track:stress-reset"]),
            ("15–20 хвилин", ["duration:15-20-min", "offer-track:stress-reset"]),
            ("30+ хвилин — готовий(а) вкластися", ["duration:30-plus-min", "offer-track:stress-reset"]),
        ],
    )

    q4m, _ = await create_question_with_answers(
        text="Де плануєш займатися?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Вдома", ["location:home", "offer-track:micro"]),
            ("В офісі / у перерві", ["location:office", "offer-track:micro"]),
            ("Де прийдеться", ["location:anywhere", "offer-track:micro"]),
        ],
    )
    q5m, _ = await create_question_with_answers(
        text="Чого хочеш досягти?",
        question_type="singe_choise",
        requires=True,
        answers=[
            ("Спалити жир та залишатися активним(ою)", ["micro-goal:fat-burn", "offer-track:micro"]),
            ("Підтримувати тонус без великих зусиль", ["micro-goal:tone", "offer-track:micro"]),
            ("Зняти напругу протягом дня", ["micro-goal:stress-relief", "offer-track:micro"]),
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
        name="Weight Loss Starter (Home)",
        description="Домашня програма для схуднення у форматі 20–30 хвилин.",
        wellness_kit_name="Home Fat-Burn Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Weight+Loss+Starter",
        wellness_kit_description="Міні-бенди, скакалка, пляшка для води та короткий гайд по домашнім кардіо-сесіям.",
        price=49.99,
        priority=90,
        default=False,
        requires_all=["goal:weight-loss", "location:home", "limitation:none", "duration:20-30-min"],
        requires_optional=["training-experience:zero", "frequency:3-4-per-week"],
        excludes=[],
    )
    await create_offer(
        name="Lean Strength Builder (Gym)",
        description="Силова програма для залу з акцентом на рельєф і прогресію.",
        wellness_kit_name="Gym Support Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Lean+Strength+Builder",
        wellness_kit_description="Лямки, міні-бенд, рушник для тренувань і чекліст прогресії по силових вправах.",
        price=59.99,
        priority=88,
        default=False,
        requires_all=["location:gym", "limitation:none"],
        requires_optional=["goal:muscle-gain", "goal:weight-loss", "priority:max-muscle", "priority:balanced"],
        excludes=[],
    )
    await create_offer(
        name="Low-Impact Fat Burn",
        description="М'який план тренувань для колін, спини та чутливих суглобів.",
        wellness_kit_name="Joint-Friendly Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Low-Impact+Fat+Burn",
        wellness_kit_description="М'які стрічки, масажний м'яч, recovery-гель та добірка вправ без ударного навантаження.",
        price=54.99,
        priority=94,
        default=False,
        requires_all=["offer-track:low-impact"],
        requires_optional=["pain-area:multiple", "limitation:knees", "limitation:back", "rehab:doctor-guidance"],
        excludes=[],
    )
    await create_offer(
        name="Run Your First 5K",
        description="Покрокова програма підготовки до перших стабільних 5 кілометрів.",
        wellness_kit_name="Runner Starter Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Run+Your+First+5K",
        wellness_kit_description="Пояс для бігу, світловідбивач, електроліти та стартовий план бігових тижнів.",
        price=44.99,
        priority=93,
        default=False,
        requires_all=["offer-track:running"],
        requires_optional=["running-goal:event", "running-goal:sub-30", "running-experience:none"],
        excludes=[],
    )
    await create_offer(
        name="Yoga & Mobility",
        description="Програма для мобільності, постави й відновлення через м'яку практику.",
        wellness_kit_name="Mobility Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Yoga+%26+Mobility",
        wellness_kit_description="Ремінець для розтяжки, масажний м'яч та домашній mobility-набір.",
        price=39.99,
        priority=92,
        default=False,
        requires_all=["offer-track:yoga-mobility"],
        requires_optional=["mobility-focus:posture", "mobility-focus:hips-legs", "practice-time:evening"],
        excludes=[],
    )
    await create_offer(
        name="Stress Reset Program",
        description="Короткі щоденні практики для зниження стресу та відновлення ресурсу.",
        wellness_kit_name="Calm-Now Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Stress+Reset+Program",
        wellness_kit_description="Маска для сну, ролер з ароматом, антистрес-м'ячик та набір мікроритуалів.",
        price=29.99,
        priority=91,
        default=False,
        requires_all=["offer-track:stress-reset"],
        requires_optional=["stress-state:poor-sleep", "stress-state:burnout", "duration:5-10-min"],
        excludes=[],
    )
    await create_offer(
        name="Quick Fit Micro-Workouts",
        description="Мікро-тренування на 10–15 хвилин для щільного графіка.",
        wellness_kit_name="Micro-Workout Kit",
        wellness_kit_image_url="https://placehold.co/600x400?text=Quick+Fit+Micro-Workouts",
        wellness_kit_description="Слайдери, міні-бенди, пляшка для води та короткі мікро-комплекси на кожен день.",
        price=34.99,
        priority=95,
        default=False,
        requires_all=["offer-track:micro"],
        requires_optional=["micro-goal:fat-burn", "micro-goal:tone", "location:office"],
        excludes=[],
    )

    flow = await Flow.create(
        name="Default Wellness Flow",
        is_active=True,
    )
    ordered_questions = [
        q1,
        q2a,
        q3a,
        q4a,
        q5a,
        q6a,
        q7a,
        q2b,
        q3b,
        q4b,
        q5b,
        q6b,
        q7b,
        q4c,
        q5c,
        q6c,
        q2e,
        q3e,
        q4e,
        q5e,
        q6e,
        q7e,
        q2f,
        q3f,
        q4f,
        q5f,
        q6f,
        q2g,
        q3g,
        q4g,
        q5g,
        q6g,
        q4m,
        q5m,
    ]
    for position, question in enumerate(ordered_questions, start=1):
        await FlowQuestion.create(
            flow=flow,
            question=question,
            position=position,
        )

    goal_weight_loss_answer = q1_answers["Схуднути та спалити жир"]
    goal_muscle_gain_answer = q1_answers["Набрати м'язи та рельєф"]
    goal_run_answer = q1_answers["Почати бігати / підготуватися до 5K"]
    goal_mobility_answer = q1_answers["Гнучкість, постава, мобільність"]
    goal_stress_answer = q1_answers["Знизити стрес, відновитися"]

    restrictive_a_answers = [
        q5a_answers["Болять коліна або суглоби"],
        q5a_answers["Проблеми зі спиною або поперек"],
        q5a_answers["Вагітність або післяпологовий період"],
    ]
    restrictive_b_answers = [
        q6b_answers["Болять коліна або суглоби"],
        q6b_answers["Проблеми зі спиною або поперек"],
        q6b_answers["Вагітність або післяпологовий період"],
    ]

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

    await create_transition(q1, q2a, "answer_any", 10, [goal_weight_loss_answer])
    await create_transition(q1, q2b, "answer_any", 20, [goal_muscle_gain_answer])
    await create_transition(q1, q2e, "answer_any", 30, [goal_run_answer])
    await create_transition(q1, q2f, "answer_any", 40, [goal_mobility_answer])
    await create_transition(q1, q2g, "answer_any", 50, [goal_stress_answer])

    await create_transition(q2a, q3a, "always", 10)
    await create_transition(q3a, q4a, "always", 10)
    await create_transition(q4a, q5a, "always", 10)
    await create_transition(q5a, q4c, "answer_any", 10, restrictive_a_answers)
    await create_transition(q5a, q6a, "answer_any", 20, [q5a_answers["Немає обмежень — все ок"]])
    await create_transition(q6a, q7a, "always", 10)
    await create_transition(q7a, q4m, "answer_any", 10, [q7a_answers["До 15 хв"]])
    await create_transition(
        q7a,
        None,
        "answer_any",
        20,
        [q7a_answers["20–30 хвилин"], q7a_answers["30–60 хвилин"]],
    )

    await create_transition(q2b, q3b, "always", 10)
    await create_transition(q3b, q4b, "always", 10)
    await create_transition(q4b, q5b, "always", 10)
    await create_transition(q5b, q6b, "always", 10)
    await create_transition(q6b, q4c, "answer_any", 10, restrictive_b_answers)
    await create_transition(q6b, q7b, "answer_any", 20, [q6b_answers["Немає обмежень — все ок"]])
    await create_transition(q7b, q4m, "answer_any", 10, [q7b_answers["До 15 хв"]])
    await create_transition(
        q7b,
        None,
        "answer_any",
        20,
        [q7b_answers["20–30 хвилин"], q7b_answers["30–60 хвилин"]],
    )

    await create_transition(q4c, q5c, "always", 10)
    await create_transition(q5c, q6c, "always", 10)
    await create_transition(q6c, None, "always", 10)

    await create_transition(q2e, q3e, "always", 10)
    await create_transition(q3e, q4e, "always", 10)
    await create_transition(q4e, q5e, "always", 10)
    await create_transition(q5e, q6e, "always", 10)
    await create_transition(q6e, q7e, "always", 10)
    await create_transition(q7e, None, "always", 10)

    await create_transition(q2f, q3f, "always", 10)
    await create_transition(q3f, q4f, "always", 10)
    await create_transition(q4f, q5f, "always", 10)
    await create_transition(q5f, q6f, "always", 10)
    await create_transition(q6f, None, "always", 10)

    await create_transition(q2g, q3g, "always", 10)
    await create_transition(q3g, q4g, "always", 10)
    await create_transition(q4g, q5g, "always", 10)
    await create_transition(q5g, q6g, "always", 10)
    await create_transition(q6g, None, "always", 10)

    await create_transition(q4m, q5m, "always", 10)
    await create_transition(q5m, None, "always", 10)
