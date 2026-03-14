import type {
	AnswerValue,
	BooleanQuestion,
	MultiChoiceQuestion,
	QuizAnswers,
	SingleChoiceQuestion,
} from "../types";
import { InfoCard } from "./InfoCard";

type ChoiceQuestion = SingleChoiceQuestion | MultiChoiceQuestion | BooleanQuestion;

interface ChoiceQuestionStepProps {
	question: ChoiceQuestion;
	answers: QuizAnswers;
	infoTitle: string;
	infoDescription: string;
	hasError: boolean;
	onChange: (next: AnswerValue) => void;
}

function getOptionState(question: ChoiceQuestion, answers: QuizAnswers, optionValue: string) {
	const answer = answers[question.id];

	if (question.type === "single") {
		return answer === optionValue;
	}

	if (question.type === "multi") {
		return Array.isArray(answer) && answer.includes(optionValue);
	}

	if (question.type === "boolean") {
		if (optionValue === "true") return answer === true;
		return answer === false;
	}

	return false;
}

export function ChoiceQuestionStep({
	question,
	answers,
	infoTitle,
	infoDescription,
	hasError,
	onChange,
}: ChoiceQuestionStepProps) {
	const options =
		question.type === "boolean"
			? [
					{
						value: "true",
						label: question.trueLabel,
						description: question.trueDescription,
					},
					{
						value: "false",
						label: question.falseLabel,
						description: question.falseDescription,
					},
			  ]
			: question.options;

	function handleOptionPress(optionValue: string) {
		if (question.type === "single") {
			onChange(optionValue);
			return;
		}

		if (question.type === "multi") {
			const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : [];
			const exists = current.includes(optionValue);
			if (exists) {
				onChange(current.filter((item) => item !== optionValue));
				return;
			}

			const next = [...current, optionValue];
			const maxSelected = question.maxSelected;
			if (typeof maxSelected === "number" && next.length > maxSelected) return;
			onChange(next);
			return;
		}

		if (question.type === "boolean") {
			onChange(optionValue === "true");
		}
	}

	return (
		<div className="flex flex-1 flex-col">
			<h1 className="text-[40px] font-semibold leading-[1.05] tracking-tight text-[#173325]">
				{question.title}
			</h1>
			{question.subtitle && (
				<p className="mt-3 text-[15px] leading-relaxed text-[#4d6a59]">
					{question.subtitle}
				</p>
			)}
			{hasError && (
				<p className="mt-2 text-[13px] font-semibold text-[#c53d3d]">
					Ви не обрали категорію. Оберіть варіант, щоб продовжити.
				</p>
			)}

			<div className="mt-8 space-y-3">
				{options.map((option) => {
					const Icon = option.icon;
					const selected = getOptionState(question, answers, option.value);

					return (
						<button
							key={option.value}
							type="button"
							onClick={() => handleOptionPress(option.value)}
							className={`w-full rounded-[22px] border p-4 text-left transition-all ${
								selected
									? "border-[#1a7a4a] bg-[#eaf7ef] shadow-[0_8px_20px_rgba(26,122,74,0.18)]"
									: hasError
										? "border-[#e38d8d] bg-[#fff7f7]"
										: "border-[#d4e8db] bg-white"
							}`}
						>
							<div className="flex items-start gap-3">
								{Icon && (
									<span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ddf0e5] text-[#1a7a4a]">
										<Icon className="h-5 w-5" />
									</span>
								)}
								<div className="min-w-0 flex-1">
									<p className="text-[17px] font-semibold text-[#153624]">{option.label}</p>
									{option.description && (
										<p className="mt-1 text-[13px] leading-relaxed text-[#547161]">
											{option.description}
										</p>
									)}
								</div>
								<span
									className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
										selected
											? "border-[#1a7a4a] bg-[#1a7a4a]"
											: "border-[#bdd8c9] bg-white"
									}`}
								>
									{selected && <span className="h-2 w-2 rounded-full bg-white" />}
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{(infoTitle || infoDescription) && (
				<InfoCard title={infoTitle} description={infoDescription} />
			)}
		</div>
	);
}
