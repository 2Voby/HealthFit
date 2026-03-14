import { describe, expect, it } from "vitest";
import { HARD_CODED_QUIZ_QUESTIONS } from "../mockQuizConfig";

describe("mock quiz config", () => {
	it("keeps gender options strict: only woman/man", () => {
		const genderQuestion = HARD_CODED_QUIZ_QUESTIONS.find((q) => q.id === "gender");
		expect(genderQuestion?.type).toBe("single");

		if (!genderQuestion || genderQuestion.type !== "single") {
			throw new Error("Gender question is missing or has invalid type");
		}

		expect(genderQuestion.options.map((option) => option.value)).toEqual(["woman", "man"]);
	});

	it("contains branch questions for home/gym/outdoor context", () => {
		const homeBranch = HARD_CODED_QUIZ_QUESTIONS.find((q) => q.id === "context_equipment_home");
		const gymBranch = HARD_CODED_QUIZ_QUESTIONS.find((q) => q.id === "context_gym_load");
		const outdoorBranch = HARD_CODED_QUIZ_QUESTIONS.find((q) => q.id === "context_outdoor_style");

		expect(homeBranch?.visibleIf?.[0]).toEqual({
			questionId: "context_place",
			operator: "equals",
			value: "home",
		});
		expect(gymBranch?.visibleIf?.[0]).toEqual({
			questionId: "context_place",
			operator: "equals",
			value: "gym",
		});
		expect(outdoorBranch?.visibleIf?.[0]).toEqual({
			questionId: "context_place",
			operator: "equals",
			value: "outdoor",
		});
	});
});
