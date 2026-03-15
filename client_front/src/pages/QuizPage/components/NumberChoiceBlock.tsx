// src/pages/QuizPage/components/NumberChoiceBlock.tsx
import type { Question } from "@/types/flow";
import { EditableMetricDisplay } from "./EditableMetricDisplay";
import { NumberWheel } from "./NumberWheel";

interface Props {
  question: Question;
  value: number;
  hasError: boolean;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function NumberChoiceBlock({ question, value, hasError, min, max, onChange }: Props) {
  const unit = "";

  return (
    <div className="flex flex-1 flex-col">
      {hasError && (
        <p className="mt-2 text-[13px] font-semibold text-[#c53d3d]">
          Вкажіть значення, щоб продовжити.
        </p>
      )}
      <div className={hasError ? "rounded-2xl border border-[#efb2b2] bg-[#fff8f8] pb-2" : ""}>
        <EditableMetricDisplay value={value} unit={unit} min={min} max={max} onChange={onChange} />
      </div>
      <div className="mt-auto pt-5">
        <NumberWheel value={value} min={min} max={max} unit={unit} onChange={onChange} />
      </div>
    </div>
  );
}