import type { Answer } from "@/types/flow";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveAnswerByValue(value: number, answers: Answer[]): Answer | null {
  for (const answer of answers) {
    const text = answer.text.trim();
    if (text.endsWith("+")) {
      const min = parseInt(text);
      if (value >= min) return answer;
    } else if (text.includes("-")) {
      const [min, max] = text.split("-").map(Number);
      if (value >= min && value <= max) return answer;
    }
  }
  return null;
}