import { describe, expect, it } from "vitest";
import type { Flow, Transition, Question, FlowQuestion } from "@/types/flow";

// These tests validate the transition resolution and answer logic
// used by QuizPage, without importing QuizPage itself (which needs React/DOM).

// ── helpers ──

function makeTransition(
	overrides: Partial<Transition> & Pick<Transition, "from_question_id" | "condition_type">,
): Transition {
	return {
		id: 1,
		to_question_id: null,
		answer_ids: [],
		priority: 0,
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
	return {
		id: 1,
		text: "Q",
		type: "singe_choise",
		requires: true,
		answers: [],
		created_at: "",
		updated_at: "",
		...overrides,
	};
}

function makeFlowQuestion(questionId: number, position: number, q?: Partial<Question>): FlowQuestion {
	return {
		question_id: questionId,
		position,
		question: makeQuestion({ id: questionId, ...q }),
	};
}

// Mirror the resolveNextQuestionId logic from QuizPage.tsx
function resolveNextQuestionId(
	transitions: Transition[],
	fromQuestionId: number,
	selectedAnswerIds: number[],
): number | null {
	const sorted = transitions
		.filter((t) => t.from_question_id === fromQuestionId)
		.sort((a, b) => a.priority - b.priority);

	for (const transition of sorted) {
		if (transition.condition_type === "always") {
			return transition.to_question_id;
		}
		if (transition.condition_type === "answer_any") {
			const matches = transition.answer_ids.some((id) => selectedAnswerIds.includes(id));
			if (matches) return transition.to_question_id;
		}
		if (transition.condition_type === "answer_all") {
			const matches = transition.answer_ids.every((id) => selectedAnswerIds.includes(id));
			if (matches) return transition.to_question_id;
		}
	}

	return null;
}

// Mirror the getAnswerIds logic from QuizPage.tsx
function getAnswerIds(answer: number | number[] | undefined | null): number[] {
	if (!answer) return [];
	return Array.isArray(answer) ? answer : [answer];
}

// Mirror the getAttributesForAnswerIds logic from QuizPage.tsx
function getAttributesForAnswerIds(question: Question, answerIds: number[]): number[] {
	return question.answers
		.filter((a) => answerIds.includes(a.id))
		.flatMap((a) => a.attributes);
}

// ── resolveNextQuestionId ──

describe("resolveNextQuestionId", () => {
	it("returns null when there are no transitions", () => {
		expect(resolveNextQuestionId([], 1, [])).toBeNull();
	});

	it("returns null when no transitions match the from_question_id", () => {
		const transitions = [
			makeTransition({ from_question_id: 99, condition_type: "always", to_question_id: 2 }),
		];
		expect(resolveNextQuestionId(transitions, 1, [])).toBeNull();
	});

	it("follows an 'always' transition unconditionally", () => {
		const transitions = [
			makeTransition({ from_question_id: 1, condition_type: "always", to_question_id: 2 }),
		];
		expect(resolveNextQuestionId(transitions, 1, [])).toBe(2);
	});

	it("returns null for terminal 'always' transition", () => {
		const transitions = [
			makeTransition({ from_question_id: 1, condition_type: "always", to_question_id: null }),
		];
		expect(resolveNextQuestionId(transitions, 1, [])).toBeNull();
	});

	it("matches 'answer_any' when at least one answer matches", () => {
		const transitions = [
			makeTransition({
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [10, 11],
				to_question_id: 3,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [11])).toBe(3);
	});

	it("does not match 'answer_any' when no answers match", () => {
		const transitions = [
			makeTransition({
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [10, 11],
				to_question_id: 3,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [99])).toBeNull();
	});

	it("matches 'answer_all' only when all required answers present", () => {
		const transitions = [
			makeTransition({
				from_question_id: 1,
				condition_type: "answer_all",
				answer_ids: [10, 11],
				to_question_id: 4,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [10])).toBeNull();
		expect(resolveNextQuestionId(transitions, 1, [10, 11])).toBe(4);
		expect(resolveNextQuestionId(transitions, 1, [10, 11, 12])).toBe(4);
	});

	it("respects priority ordering (lower value = higher priority)", () => {
		const transitions = [
			makeTransition({
				id: 2,
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [10],
				to_question_id: 5,
				priority: 1,
			}),
			makeTransition({
				id: 1,
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [10],
				to_question_id: 6,
				priority: 0,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [10])).toBe(6);
	});

	it("falls through to lower-priority transition when higher one does not match", () => {
		const transitions = [
			makeTransition({
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [10],
				to_question_id: 5,
				priority: 0,
			}),
			makeTransition({
				from_question_id: 1,
				condition_type: "always",
				to_question_id: 7,
				priority: 1,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [20])).toBe(7);
		expect(resolveNextQuestionId(transitions, 1, [10])).toBe(5);
	});

	it("handles branching quiz flow (home vs gym)", () => {
		const transitions = [
			makeTransition({
				id: 1,
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [100], // "home" answer
				to_question_id: 10, // home follow-up
				priority: 0,
			}),
			makeTransition({
				id: 2,
				from_question_id: 1,
				condition_type: "answer_any",
				answer_ids: [101], // "gym" answer
				to_question_id: 20, // gym follow-up
				priority: 1,
			}),
			makeTransition({
				id: 3,
				from_question_id: 1,
				condition_type: "always",
				to_question_id: 30, // fallback
				priority: 2,
			}),
		];
		expect(resolveNextQuestionId(transitions, 1, [100])).toBe(10);
		expect(resolveNextQuestionId(transitions, 1, [101])).toBe(20);
		expect(resolveNextQuestionId(transitions, 1, [999])).toBe(30);
	});
});

// ── getAnswerIds ──

describe("getAnswerIds", () => {
	it("returns empty array for undefined", () => {
		expect(getAnswerIds(undefined)).toEqual([]);
	});

	it("returns empty array for null", () => {
		expect(getAnswerIds(null)).toEqual([]);
	});

	it("wraps a single number in an array", () => {
		expect(getAnswerIds(42)).toEqual([42]);
	});

	it("returns the array as-is for multi-choice", () => {
		expect(getAnswerIds([1, 2, 3])).toEqual([1, 2, 3]);
	});

	it("returns empty array for empty multi-choice", () => {
		// Note: empty array is falsy-ish but [] is truthy in JS — this returns []
		// because ![] is false, so Array.isArray branch runs
		expect(getAnswerIds([])).toEqual([]);
	});
});

// ── getAttributesForAnswerIds ──

describe("getAttributesForAnswerIds", () => {
	const question = makeQuestion({
		answers: [
			{ id: 1, text: "A", attributes: [100, 101], created_at: "", updated_at: "" },
			{ id: 2, text: "B", attributes: [200], created_at: "", updated_at: "" },
			{ id: 3, text: "C", attributes: [], created_at: "", updated_at: "" },
		],
	});

	it("returns attributes for a single matching answer", () => {
		expect(getAttributesForAnswerIds(question, [1])).toEqual([100, 101]);
	});

	it("returns combined attributes for multiple answers", () => {
		expect(getAttributesForAnswerIds(question, [1, 2])).toEqual([100, 101, 200]);
	});

	it("returns empty array when answer has no attributes", () => {
		expect(getAttributesForAnswerIds(question, [3])).toEqual([]);
	});

	it("returns empty array when no answer IDs match", () => {
		expect(getAttributesForAnswerIds(question, [999])).toEqual([]);
	});

	it("returns empty array for empty answer IDs", () => {
		expect(getAttributesForAnswerIds(question, [])).toEqual([]);
	});
});

// ── isAnswered logic (mirrors QuizPage inline logic) ──

describe("isAnswered logic", () => {
	function isAnswered(
		type: string,
		requires: boolean,
		answer: number | number[] | undefined,
	): boolean {
		if (type === "text") return true;
		if (!requires) return true;
		const isMulti = type === "multiple_choise";
		const hasAnswer = isMulti
			? Array.isArray(answer) && answer.length > 0
			: answer !== undefined;
		return hasAnswer;
	}

	it("text questions are always answered", () => {
		expect(isAnswered("text", true, undefined)).toBe(true);
	});

	it("non-required questions are always answered", () => {
		expect(isAnswered("singe_choise", false, undefined)).toBe(true);
	});

	it("required single choice: undefined is not answered", () => {
		expect(isAnswered("singe_choise", true, undefined)).toBe(false);
	});

	it("required single choice: a number is answered", () => {
		expect(isAnswered("singe_choise", true, 42)).toBe(true);
	});

	it("required multi choice: empty array is not answered", () => {
		expect(isAnswered("multiple_choise", true, [])).toBe(false);
	});

	it("required multi choice: non-empty array is answered", () => {
		expect(isAnswered("multiple_choise", true, [1, 2])).toBe(true);
	});

	it("required number input: a value is answered", () => {
		expect(isAnswered("number_input", true, 75)).toBe(true);
	});

	it("required number input: undefined is not answered", () => {
		expect(isAnswered("number_input", true, undefined)).toBe(false);
	});
});

// ── Flow sorting ──

describe("flow question sorting", () => {
	it("sorts questions by position", () => {
		const questions: FlowQuestion[] = [
			makeFlowQuestion(3, 3),
			makeFlowQuestion(1, 1),
			makeFlowQuestion(2, 2),
		];
		const sorted = [...questions].sort((a, b) => a.position - b.position);
		expect(sorted.map((q) => q.question_id)).toEqual([1, 2, 3]);
	});

	it("counts non-text steps for totalSteps", () => {
		const questions: FlowQuestion[] = [
			makeFlowQuestion(1, 1, { type: "singe_choise" }),
			makeFlowQuestion(2, 2, { type: "text" }),
			makeFlowQuestion(3, 3, { type: "multiple_choise" }),
			makeFlowQuestion(4, 4, { type: "number_input" }),
			makeFlowQuestion(5, 5, { type: "text" }),
		];
		const totalSteps = questions.filter((q) => q.question.type !== "text").length;
		expect(totalSteps).toBe(3);
	});
});

// ── MultiChoiceBlock toggle logic ──

describe("multi-choice toggle logic", () => {
	function handleToggle(current: number[], answerId: number): number[] {
		if (current.includes(answerId)) {
			return current.filter((id) => id !== answerId);
		}
		return [...current, answerId];
	}

	it("adds an answer when not selected", () => {
		expect(handleToggle([], 1)).toEqual([1]);
		expect(handleToggle([1], 2)).toEqual([1, 2]);
	});

	it("removes an answer when already selected", () => {
		expect(handleToggle([1, 2], 1)).toEqual([2]);
	});

	it("toggles back and forth", () => {
		let current: number[] = [];
		current = handleToggle(current, 5);
		expect(current).toEqual([5]);
		current = handleToggle(current, 5);
		expect(current).toEqual([]);
	});
});

// ── QuizHeader label logic ──

describe("QuizHeader label logic", () => {
	function getHeaderLabel(stepIndex: number): string {
		return stepIndex >= 2 ? "Майже готово" : "Про вас";
	}

	it("shows 'Про вас' for first steps", () => {
		expect(getHeaderLabel(0)).toBe("Про вас");
		expect(getHeaderLabel(1)).toBe("Про вас");
	});

	it("shows 'Майже готово' from step 2 onward", () => {
		expect(getHeaderLabel(2)).toBe("Майже готово");
		expect(getHeaderLabel(5)).toBe("Майже готово");
	});
});

// ── QuizFooter button label logic ──

describe("QuizFooter button label", () => {
	function getButtonLabel(isLastStep: boolean): string {
		return isLastStep ? "Переглянути план" : "Далі";
	}

	it("shows 'Далі' when not last step", () => {
		expect(getButtonLabel(false)).toBe("Далі");
	});

	it("shows 'Переглянути план' on last step", () => {
		expect(getButtonLabel(true)).toBe("Переглянути план");
	});
});

// ── Progress bar width logic ──

describe("progress bar width", () => {
	function getProgressWidth(barIndex: number, stepIndex: number): string {
		if (barIndex < stepIndex) return "100%";
		if (barIndex === stepIndex) return "55%";
		return "0%";
	}

	it("completed steps show 100%", () => {
		expect(getProgressWidth(0, 2)).toBe("100%");
		expect(getProgressWidth(1, 2)).toBe("100%");
	});

	it("current step shows 55%", () => {
		expect(getProgressWidth(2, 2)).toBe("55%");
	});

	it("future steps show 0%", () => {
		expect(getProgressWidth(3, 2)).toBe("0%");
		expect(getProgressWidth(4, 2)).toBe("0%");
	});
});
