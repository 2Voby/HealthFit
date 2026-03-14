import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "../types";
import {
	buildInitialAnswers,
	getVisibleQuestions,
	isQuestionAnswered,
	resolveDynamicText,
} from "../utils";

const singleQuestion: QuizQuestion = {
	id: "q_single",
	type: "single",
	title: "Single",
	options: [{ value: "a", label: "A" }],
};

const multiQuestion: QuizQuestion = {
	id: "q_multi",
	type: "multi",
	title: "Multi",
	minSelected: 2,
	options: [
		{ value: "a", label: "A" },
		{ value: "b", label: "B" },
		{ value: "c", label: "C" },
	],
};

const booleanQuestion: QuizQuestion = {
	id: "q_bool",
	type: "boolean",
	title: "Bool",
	trueLabel: "Так",
	falseLabel: "Ні",
};

const numberQuestion: QuizQuestion = {
	id: "q_number",
	type: "number",
	title: "Number",
	unit: "кг",
	min: 40,
	max: 120,
};

describe("quiz utils", () => {
	it("buildInitialAnswers creates defaults for all question types", () => {
		const answers = buildInitialAnswers([
			singleQuestion,
			{ ...multiQuestion, defaultValue: ["a"] },
			{ ...booleanQuestion, defaultValue: true },
			{ ...numberQuestion, defaultValue: 75 },
		]);

		expect(answers.q_single).toBeNull();
		expect(answers.q_multi).toEqual(["a"]);
		expect(answers.q_bool).toBe(true);
		expect(answers.q_number).toBe(75);
	});

	it("validates required answers per question type", () => {
		expect(isQuestionAnswered(singleQuestion, null)).toBe(false);
		expect(isQuestionAnswered(singleQuestion, "a")).toBe(true);

		expect(isQuestionAnswered(multiQuestion, ["a"])).toBe(false);
		expect(isQuestionAnswered(multiQuestion, ["a", "b"])).toBe(true);

		expect(isQuestionAnswered(booleanQuestion, null)).toBe(false);
		expect(isQuestionAnswered(booleanQuestion, false)).toBe(true);

		expect(isQuestionAnswered(numberQuestion, 35)).toBe(false);
		expect(isQuestionAnswered(numberQuestion, 80)).toBe(true);
	});

	it("applies conditional visibility rules", () => {
		const questions: QuizQuestion[] = [
			{
				id: "context_place",
				type: "single",
				title: "Place",
				options: [
					{ value: "home", label: "Home" },
					{ value: "gym", label: "Gym" },
				],
			},
			{
				id: "home_load",
				type: "single",
				title: "Home load",
				options: [{ value: "light", label: "Light" }],
				visibleIf: [{ questionId: "context_place", operator: "equals", value: "home" }],
			},
			{
				id: "goals",
				type: "multi",
				title: "Goals",
				options: [{ value: "fat_loss", label: "Fat loss" }],
				visibleIf: [{ questionId: "selected_tags", operator: "includes", value: "show_goals" }],
			},
		];

		const visibleWithHome = getVisibleQuestions(questions, {
			context_place: "home",
			selected_tags: ["show_goals"],
		});
		expect(visibleWithHome.map((item) => item.id)).toEqual([
			"context_place",
			"home_load",
			"goals",
		]);

		const visibleWithGym = getVisibleQuestions(questions, {
			context_place: "gym",
			selected_tags: [],
		});
		expect(visibleWithGym.map((item) => item.id)).toEqual(["context_place"]);
	});

	it("resolves static and dynamic helper text", () => {
		expect(resolveDynamicText("static", {})).toBe("static");
		expect(resolveDynamicText((answers) => `goal:${answers.goal}`, { goal: "fat_loss" })).toBe(
			"goal:fat_loss",
		);
		expect(resolveDynamicText(undefined, {})).toBe("");
	});
});
