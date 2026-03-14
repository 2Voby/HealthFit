// src/pages/QuizPage/components/SingleChoiceStep.tsx
import type { Question, QuizAnswers } from "@/types/flow";
import { OptionButton } from "./OptionButton";

interface Props {
  question: Question;
  answers: QuizAnswers;
  hasError: boolean;
  onChange: (answerId: number) => void;
}

export function SingleChoiceBlock({ question, answers, hasError, onChange }: Props) {
  const current = answers[question.id];

  return (
    <div className="flex flex-1 flex-col">
      {hasError && (
        <p className="mt-2 text-[13px] font-semibold text-[#c53d3d]">
          Оберіть варіант, щоб продовжити.
        </p>
      )}
      <div className="mt-8 space-y-3">
        {question.answers.map((answer) => (
          <OptionButton
            key={answer.id}
            label={answer.text}
            selected={current === answer.id}
            hasError={hasError}
            onClick={() => onChange(answer.id)}
          />
        ))}
      </div>
    </div>
  );
}