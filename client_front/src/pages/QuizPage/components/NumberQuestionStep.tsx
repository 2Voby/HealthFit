import { EditableMetricDisplay } from "./EditableMetricDisplay";
import { InfoCard } from "./InfoCard";
import { NumberWheel } from "./NumberWheel";
import type { NumberQuestion } from "../types";

interface NumberQuestionStepProps {
	question: NumberQuestion;
	value: number;
	infoTitle: string;
	infoDescription: string;
	hasError: boolean;
	onChange: (next: number) => void;
}

export function NumberQuestionStep({
	question,
	value,
	infoTitle,
	infoDescription,
	hasError,
	onChange,
}: NumberQuestionStepProps) {
	const StepIcon = question.stepIcon;

	return (
		<div className="flex flex-1 flex-col">
			{StepIcon && (
				<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e5f2ea] text-[#1a7a4a]">
					<StepIcon className="h-5 w-5" />
				</span>
			)}

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
					Ви не обрали категорію. Вкажіть значення, щоб продовжити.
				</p>
			)}

			<div className={hasError ? "rounded-2xl border border-[#efb2b2] bg-[#fff8f8] pb-2" : ""}>
				<EditableMetricDisplay
					value={value}
					unit={question.unit}
					min={question.min}
					max={question.max}
					onChange={onChange}
				/>
			</div>

			{(infoTitle || infoDescription) && (
				<InfoCard title={infoTitle} description={infoDescription} />
			)}

			<div className={`mt-auto pt-5 ${hasError ? "rounded-2xl border border-[#efb2b2] bg-[#fff8f8] p-2" : ""}`}>
				<NumberWheel
					value={value}
					min={question.min}
					max={question.max}
					unit={question.unit}
					onChange={onChange}
				/>
			</div>
		</div>
	);
}
