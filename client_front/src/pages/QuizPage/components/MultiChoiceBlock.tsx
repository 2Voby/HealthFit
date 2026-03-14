// src/pages/QuizPage/components/MultiChoiceStep.tsx
import type { Question, QuizAnswers } from "@/types/flow";
import { OptionButton } from "./OptionButton";

interface Props {
	question: Question;
	answers: QuizAnswers;
	hasError: boolean;
	onChange: (answerIds: number[]) => void;
}

export function MultiChoiceBlock({ question, answers, hasError, onChange }: Props) {
	const current = Array.isArray(answers[question.id]) ? (answers[question.id] as number[]) : [];

	function handleToggle(answerId: number) {
		if (current.includes(answerId)) {
			onChange(current.filter((id) => id !== answerId));
		} else {
			onChange([...current, answerId]);
		}
	}

	return (
		<div className="flex flex-1 flex-col">
			{hasError && <p className="mt-2 text-[13px] font-semibold text-[#c53d3d]">Оберіть хоча б один варіант.</p>}
			<div className="mt-8 space-y-3">
				{question.answers.map((answer) => (
					<OptionButton
						key={answer.id}
						label={answer.text}
						selected={current.includes(answer.id)}
						hasError={hasError}
						multiple
						onClick={() => handleToggle(answer.id)}
					/>
				))}
			</div>
		</div>
	);
}
