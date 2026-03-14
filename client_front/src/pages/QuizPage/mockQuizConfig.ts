import { Dumbbell, House, Mars, Trees, Venus } from "lucide-react";
import type { QuizQuestion } from "./types";
import { calculateBmi, getBmiStatus } from "./utils";

// TODO: Replace with backend payload.
// Backend contract should return:
// - ordered list of questions
// - type: single | multi | boolean | number
// - options or numeric range
// - branching rules in visibleIf
export const HARD_CODED_QUIZ_QUESTIONS: QuizQuestion[] = [
	{
		id: "gender",
		type: "single",
		title: "Вкажіть вашу стать",
		subtitle: "Оберіть один варіант.",
		options: [
			{ value: "woman", label: "Жінка", icon: Venus },
			{ value: "man", label: "Чоловік", icon: Mars },
		],
		infoTitle: "Базова персоналізація",
		infoDescription:
			"Цей параметр не є обов'язковим, але допомагає точніше налаштувати рекомендації.",
	},
	{
		id: "age",
		type: "number",
		title: "Вкажіть ваш вік",
		subtitle: "Або передавайте з backend віковий діапазон як single-question.",
		unit: "р.",
		min: 14,
		max: 75,
		defaultValue: 29,
		infoTitle: "Вік впливає на темп прогресу",
		infoDescription:
			"На основі віку ми коригуємо інтенсивність і відновлення.",
	},
	{
		id: "height",
		type: "number",
		title: "Вкажіть ваш зріст",
		unit: "см",
		min: 140,
		max: 210,
		defaultValue: 175,
		infoTitle: "Потрібно для розрахунку ІМТ",
		infoDescription:
			"Зріст допомагає коректніше оцінити навантаження та рекомендації.",
	},
	{
		id: "weight",
		type: "number",
		title: "Вкажіть вашу вагу",
		unit: "кг",
		min: 40,
		max: 180,
		defaultValue: 80,
		infoTitle: (answers) => {
			const bmi = calculateBmi(Number(answers.height ?? 0), Number(answers.weight ?? 0));
			return `Ваш ІМТ — ${bmi.toFixed(1)}, ${getBmiStatus(bmi)}`;
		},
		infoDescription:
			"Це стартова оцінка. Далі план адаптується за вашими відповідями та прогресом.",
	},
	{
		id: "goal",
		type: "single",
		title: "Яка ваша головна ціль?",
		options: [
			{ value: "fat_loss", label: "Схуднення" },
			{ value: "strength", label: "Сила" },
			{ value: "endurance", label: "Витривалість" },
			{ value: "flexibility", label: "Гнучкість" },
			{ value: "stress_reduction", label: "Зниження стресу" },
		],
		infoTitle: "Ціль = основа сценарію",
		infoDescription:
			"Першочергова ціль визначає логіку тренувального плану.",
	},
	{
		id: "context_place",
		type: "single",
		title: "Де ви плануєте тренуватись?",
		subtitle: "Після вибору покажемо релевантні додаткові питання.",
		options: [
			{ value: "home", label: "Вдома", icon: House, description: "Гнучкий графік" },
			{ value: "gym", label: "У залі", icon: Dumbbell, description: "Доступ до обладнання" },
			{ value: "outdoor", label: "На вулиці", icon: Trees, description: "Свіже повітря" },
		],
		infoTitle: "Контекст тренувань",
		infoDescription: "Від місця занять залежить подальша гілка опитування.",
	},
	{
		id: "context_equipment_home",
		type: "multi",
		title: "Яке обладнання є вдома?",
		subtitle: "Можна обрати кілька.",
		minSelected: 1,
		maxSelected: 4,
		options: [
			{ value: "bands", label: "Еспандери" },
			{ value: "dumbbells", label: "Гантелі" },
			{ value: "mat", label: "Килимок" },
			{ value: "none", label: "Немає обладнання" },
		],
		visibleIf: [{ questionId: "context_place", operator: "equals", value: "home" }],
		infoTitle: "Домашній контекст",
		infoDescription:
			"Підбираємо вправи під те, що реально у вас є.",
	},
	{
		id: "context_gym_load",
		type: "single",
		title: "Яке навантаження у залі вам підходить?",
		options: [
			{ value: "light", label: "Легке" },
			{ value: "moderate", label: "Помірне" },
			{ value: "intense", label: "Інтенсивне" },
			{ value: "mixed", label: "Змішане" },
		],
		visibleIf: [{ questionId: "context_place", operator: "equals", value: "gym" }],
		infoTitle: "Гілка залу",
		infoDescription:
			"Це питання бачать тільки користувачі, що обрали зал.",
	},
	{
		id: "context_outdoor_style",
		type: "single",
		title: "Який outdoor-формат вам ближчий?",
		options: [
			{ value: "walk_run", label: "Ходьба + біг" },
			{ value: "intervals", label: "Інтервали" },
			{ value: "mixed", label: "Змішаний формат" },
		],
		visibleIf: [{ questionId: "context_place", operator: "equals", value: "outdoor" }],
		infoTitle: "Гілка outdoor",
		infoDescription: "Формуємо план залежно від того, як ви любите рухатись на вулиці.",
	},
	{
		id: "constraint_time",
		type: "single",
		title: "Скільки часу ви реально готові приділяти?",
		options: [
			{ value: "10_15", label: "10–15 хв" },
			{ value: "20_30", label: "20–30 хв" },
			{ value: "30_45", label: "30–45 хв" },
			{ value: "45_plus", label: "45+ хв" },
		],
		infoTitle: "Реалістичний підхід",
		infoDescription: "Краще стабільний короткий план, ніж ідеальний, але нереалістичний.",
	},
	{
		id: "constraint_schedule",
		type: "single",
		title: "Який у вас графік?",
		options: [
			{ value: "stable", label: "Стабільний" },
			{ value: "shift", label: "Змінний" },
			{ value: "busy_unstable", label: "Дуже нестабільний" },
		],
		infoTitle: "План під ритм життя",
		infoDescription: "Графік впливає на кількість і тривалість сесій.",
	},
	{
		id: "constraint_injuries",
		type: "boolean",
		title: "Є травми або обмеження, які потрібно врахувати?",
		trueLabel: "Так",
		falseLabel: "Ні",
		trueDescription: "Потрібна адаптація навантаження",
		falseDescription: "Рухаємося за базовим сценарієм",
		infoTitle: "Безпека понад усе",
		infoDescription:
			"Якщо є обмеження — підлаштовуємо вправи та темп.",
	},
	{
		id: "constraint_injury_zone",
		type: "multi",
		title: "Що саме турбує?",
		subtitle: "Можна обрати кілька зон.",
		minSelected: 1,
		maxSelected: 4,
		options: [
			{ value: "knees", label: "Коліна" },
			{ value: "back", label: "Спина" },
			{ value: "shoulders", label: "Плечі" },
			{ value: "neck", label: "Шия" },
			{ value: "other", label: "Інше" },
		],
		visibleIf: [{ questionId: "constraint_injuries", operator: "equals", value: true }],
		infoTitle: "Точна адаптація",
		infoDescription:
			"На цих даних будуємо безпечні модифікації вправ.",
	},
	{
		id: "level",
		type: "single",
		title: "Який ваш рівень зараз?",
		options: [
			{ value: "beginner", label: "Beginner" },
			{ value: "intermediate", label: "Intermediate" },
			{ value: "advanced", label: "Advanced" },
		],
		infoTitle: "Рівень підготовки",
		infoDescription:
			"Стартуємо з навантаження, яке вам реально підходить.",
	},
	{
		id: "motivation_now",
		type: "single",
		title: "Чому ви хочете почати саме зараз?",
		options: [
			{ value: "health", label: "Покращити здоров'я" },
			{ value: "appearance", label: "Покращити форму" },
			{ value: "energy", label: "Повернути енергію" },
			{ value: "event", label: "Підготуватись до події" },
		],
		infoTitle: "Мотивація",
		infoDescription: "Сильний мотив допомагає утримати дисципліну в довгу.",
	},
	{
		id: "barriers",
		type: "multi",
		title: "Що заважає тримати режим?",
		subtitle: "Можна обрати кілька.",
		minSelected: 1,
		maxSelected: 4,
		options: [
			{ value: "stress", label: "Стрес" },
			{ value: "fatigue", label: "Втома" },
			{ value: "lack_time", label: "Брак часу" },
			{ value: "discipline", label: "Брак дисципліни" },
			{ value: "low_motivation", label: "Складно мотивувати себе" },
		],
		infoTitle: "Бар'єри",
		infoDescription:
			"Це потрібно, щоб одразу вбудувати антикризові сценарії у план.",
	},
	{
		id: "pref_intensity",
		type: "single",
		title: "Яка інтенсивність вам комфортна?",
		options: [
			{ value: "low", label: "Низька" },
			{ value: "moderate", label: "Помірна" },
			{ value: "high", label: "Висока" },
			{ value: "mixed", label: "Змінна" },
		],
		infoTitle: "Персональні вподобання",
		infoDescription:
			"Підлаштовуємо стиль тренувань під ваш темперамент і ресурс.",
	},
	{
		id: "pref_format",
		type: "multi",
		title: "Який формат вам найбільше заходить?",
		subtitle: "Можна обрати до 3 варіантів.",
		minSelected: 1,
		maxSelected: 3,
		options: [
			{ value: "short_sessions", label: "Короткі сесії" },
			{ value: "yoga", label: "Йога / мобільність" },
			{ value: "running", label: "Біг" },
			{ value: "strength", label: "Силові" },
			{ value: "recovery", label: "Відновлення / розтяжка" },
		],
		infoTitle: "Формат активності",
		infoDescription:
			"Це впливає на структуру тижня та тип тренувальних блоків.",
	},
	{
		id: "wellbeing_stress",
		type: "single",
		title: "Як ви оцінюєте поточний рівень стресу?",
		options: [
			{ value: "low", label: "Низький" },
			{ value: "medium", label: "Середній" },
			{ value: "high", label: "Високий" },
		],
		infoTitle: "Self-reported wellbeing",
		infoDescription: "Самооцінка стану допомагає не перегрузити вас на старті.",
	},
	{
		id: "wellbeing_sleep",
		type: "single",
		title: "Як ви оцінюєте якість сну?",
		options: [
			{ value: "poor", label: "Погано" },
			{ value: "ok", label: "Нормально" },
			{ value: "good", label: "Добре" },
		],
		infoTitle: "Сон",
		infoDescription: "Сон напряму впливає на відновлення і толерантність до навантаження.",
	},
	{
		id: "wellbeing_energy",
		type: "single",
		title: "Який ваш рівень енергії протягом дня?",
		options: [
			{ value: "low", label: "Низький" },
			{ value: "medium", label: "Середній" },
			{ value: "high", label: "Високий" },
		],
		infoTitle: "Енергія",
		infoDescription:
			"Це фінальний параметр, який впливає на стартову інтенсивність плану.",
	},
];
