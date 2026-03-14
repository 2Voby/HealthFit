// src/types/quiz.types.ts
export type QuestionType = "singe_choise" | "multiple_choise" | "number_input";

export interface Answer {
  id: number;
  text: string;
  attributes: number[];
}
