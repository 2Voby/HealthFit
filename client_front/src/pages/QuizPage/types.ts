import type { LucideIcon } from "lucide-react";

export type QuestionType = "single" | "multi" | "boolean" | "number";

export type AnswerValue =
	| string
	| string[]
	| number
	| boolean
	| null
	| undefined;

export type QuizAnswers = Record<string, AnswerValue>;

export type DynamicText = string | ((answers: QuizAnswers) => string);

export interface QuizCondition {
	questionId: string;
	operator: "equals" | "not_equals" | "includes";
	value: string | number | boolean;
}

export interface BaseQuestion {
	id: string;
	type: QuestionType;
	title: string;
	subtitle?: string;
	infoTitle?: DynamicText;
	infoDescription?: DynamicText;
	visibleIf?: QuizCondition[];
}

export interface ChoiceOption {
	value: string;
	label: string;
	description?: string;
	icon?: LucideIcon;
}

export interface SingleChoiceQuestion extends BaseQuestion {
	type: "single";
	options: ChoiceOption[];
	defaultValue?: string;
}

export interface MultiChoiceQuestion extends BaseQuestion {
	type: "multi";
	options: ChoiceOption[];
	minSelected?: number;
	maxSelected?: number;
	defaultValue?: string[];
}

export interface BooleanQuestion extends BaseQuestion {
	type: "boolean";
	defaultValue?: boolean;
	trueLabel: string;
	falseLabel: string;
	trueDescription?: string;
	falseDescription?: string;
}

export interface NumberQuestion extends BaseQuestion {
	type: "number";
	unit: string;
	min: number;
	max: number;
	defaultValue?: number;
	stepIcon?: LucideIcon;
}

export type QuizQuestion =
	| SingleChoiceQuestion
	| MultiChoiceQuestion
	| BooleanQuestion
	| NumberQuestion;
