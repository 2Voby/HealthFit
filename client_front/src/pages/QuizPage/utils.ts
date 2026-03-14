import type {
	AnswerValue,
	DynamicText,
	QuizAnswers,
	QuizCondition,
	QuizQuestion,
} from "./types";

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export function calculateBmi(heightCm: number, weightKg: number) {
	const heightInMeters = heightCm / 100;
	if (heightInMeters <= 0) return 0;
	return weightKg / (heightInMeters * heightInMeters);
}

export function getBmiStatus(value: number) {
	if (value < 18.5) return "нижче норми";
	if (value < 25) return "у межах норми";
	if (value < 30) return "трохи вище норми";
	return "вище норми";
}

export function resolveDynamicText(value: DynamicText | undefined, answers: QuizAnswers) {
	if (!value) return "";
	return typeof value === "function" ? value(answers) : value;
}

function checkCondition(condition: QuizCondition, answers: QuizAnswers) {
	const answer = answers[condition.questionId];

	if (condition.operator === "equals") {
		return answer === condition.value;
	}

	if (condition.operator === "not_equals") {
		return answer !== condition.value;
	}

	if (condition.operator === "includes") {
		return Array.isArray(answer) && answer.includes(String(condition.value));
	}

	return true;
}

export function isQuestionVisible(question: QuizQuestion, answers: QuizAnswers) {
	if (!question.visibleIf || question.visibleIf.length === 0) return true;
	return question.visibleIf.every((condition) => checkCondition(condition, answers));
}

export function getVisibleQuestions(questions: QuizQuestion[], answers: QuizAnswers) {
	return questions.filter((question) => isQuestionVisible(question, answers));
}

export function isQuestionAnswered(question: QuizQuestion, answer: AnswerValue) {
	if (question.type === "single") {
		return typeof answer === "string" && answer.length > 0;
	}

	if (question.type === "multi") {
		const min = question.minSelected ?? 1;
		return Array.isArray(answer) && answer.length >= min;
	}

	if (question.type === "boolean") {
		return typeof answer === "boolean";
	}

	if (question.type === "number") {
		return (
			typeof answer === "number" &&
			Number.isFinite(answer) &&
			answer >= question.min &&
			answer <= question.max
		);
	}

	return false;
}

export function buildInitialAnswers(questions: QuizQuestion[]) {
	const initial: QuizAnswers = {};

	for (const question of questions) {
		if (question.type === "single") {
			initial[question.id] = question.defaultValue ?? null;
			continue;
		}

		if (question.type === "multi") {
			initial[question.id] = question.defaultValue ?? [];
			continue;
		}

		if (question.type === "boolean") {
			initial[question.id] = question.defaultValue ?? null;
			continue;
		}

		if (question.type === "number") {
			initial[question.id] = question.defaultValue ?? question.min;
		}
	}

	return initial;
}
