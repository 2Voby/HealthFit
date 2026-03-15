// src/types/flow.ts
export type QuestionType = "singe_choise" | "multiple_choise" | "manual_input" | "text";

export interface ManualInputConfig {
  type: "number";
  min: number;
  max: number;
}

export interface Answer {
  id: number;
  text: string;
  attributes: number[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  manual_input?: ManualInputConfig | null;
  requires: boolean;
  answers: Answer[];
  created_at: string;
  updated_at: string;
}

export interface FlowQuestion {
  question_id: number;
  position: number;
  question: Question;
}

export interface Transition {
  id: number;
  from_question_id: number;
  to_question_id: number | null;
  condition_type: "always" | "answer_any" | "answer_all";
  answer_ids: number[];
  priority: number;
  created_at: string;
  updated_at: string;
}
export interface Flow {
  id: number;
  name: string;
  is_active: boolean;
  start_question_id: number;
  questions: FlowQuestion[];
  transitions: Transition[];
  created_at: string;
  updated_at: string;
}

export type AnswerValue = number | number[] | null;
export type QuizAnswers = Record<number, AnswerValue>;
