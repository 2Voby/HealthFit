import { useEffect, useState } from "react";
import { ROUTES } from "@/consts/routes";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { QuizFooter } from "./components/QuizFooter";
import { QuizHeader } from "./components/QuizHeader";
import { getActiveFlow } from "@/api/requests";
import type { Flow, FlowQuestion } from "@/types/flow";
import { Info, Loader2 } from "lucide-react";
import { SingleChoiceBlock } from "./components/SingleChoiceBlock";
import { MultiChoiceBlock } from "./components/MultiChoiceBlock";
import { NumberChoiceBlock } from "./components/NumberChoiceBlock";
import { Sparkles } from "lucide-react";
import type { QuizAnswers, AnswerValue } from "@/types/flow";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
	const navigate = useNavigate();

	const [flow, setFlow] = useState<Flow | null>(null);
	const [stepIndex, setStepIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
	const [loading, setLoading] = useState(true);
	const [invalidQuestionId, setInvalidQuestionId] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			const result = await getActiveFlow();
			if (!result.success) {
				toast.error("Cannot get quiz questions!");
				return;
			}
			setFlow(result.data);
			setLoading(false);
		}
		load();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f4faf6] flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-[#1a7a4a]" />
			</div>
		);
	}

	if (!flow) return null;

	const questions = [...flow.questions].sort((a, b) => a.position - b.position);
	const totalSteps = questions.length;
	const current = questions[stepIndex];
	const currentQ = current.question;
	const currentAnswer = answers[currentQ.id];
	const isMulti = currentQ.type === "multiple_choise";
	const isAnswered = isMulti ? Array.isArray(currentAnswer) && currentAnswer.length > 0 : currentAnswer !== undefined;
	const canContinue = !currentQ.requires || isAnswered;
	const isLastStep = stepIndex === totalSteps - 1;
	const hasError = invalidQuestionId === currentQ.id;

	function handleBack() {
		setInvalidQuestionId(null);
		if (stepIndex === 0) {
			navigate(ROUTES.MAIN);
			return;
		}
		setStepIndex((i) => i - 1);
	}

	function handleNext() {
		if (!canContinue) {
			setInvalidQuestionId(currentQ.id);
			toast.error("Оберіть варіант, щоб продовжити.");
			return;
		}
		setInvalidQuestionId(null);
		if (isLastStep) {
			navigate(ROUTES.RESULT);
			return;
		}
		setStepIndex((i) => i + 1);
	}

	return (
		<div className="min-h-screen bg-[#f4faf6] text-[#173325]">
			<QuizHeader stepIndex={stepIndex} totalSteps={totalSteps} onBack={handleBack} />

			<main
				className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-4 pt-6"
				style={{ paddingBottom: "calc(8.8rem + env(safe-area-inset-bottom))" }}>
				{currentQ.type === "text" ? (
					<div className="rounded-2xl border border-[#d7e9dd] bg-white p-6 flex flex-col items-center text-center gap-4">
						<div className="w-16 h-16 rounded-full bg-[#e6f4ec] flex items-center justify-center">
							<Sparkles className="w-8 h-8 text-[#1a7a4a]" />
						</div>
						<div>
							<h2 className="text-[22px] font-semibold text-[#173325] leading-snug">{currentQ.text}</h2>
						</div>
					</div>
				) : (
					<>
						<div className="mb-4">
							<h1 className="text-[40px] font-semibold leading-[1.05] tracking-tight text-[#173325]">{currentQ.text}</h1>
							{isMulti && <p className="text-[13px] text-[#547161] mt-1">Можна обрати кілька варіантів</p>}
						</div>

						<div className="flex flex-col gap-3">
							{currentQ.type === "singe_choise" && (
								<SingleChoiceBlock
									question={currentQ}
									answers={answers}
									hasError={hasError}
									onChange={(id) => {
										setAnswers((a) => ({ ...a, [currentQ.id]: id }));
										setInvalidQuestionId(null);
									}}
								/>
							)}
							{currentQ.type === "multiple_choise" && (
								<MultiChoiceBlock
									question={currentQ}
									answers={answers}
									hasError={hasError}
									onChange={(ids) => {
										setAnswers((a) => ({ ...a, [currentQ.id]: ids }));
										setInvalidQuestionId(null);
									}}
								/>
							)}
							{currentQ.type === "number_input" && (
								<NumberChoiceBlock
									question={currentQ}
									value={Number(answers[currentQ.id] ?? 0)}
									hasError={hasError}
									onChange={(val) => setAnswers((a) => ({ ...a, [currentQ.id]: val }))}
								/>
							)}
						</div>
					</>
				)}
			</main>

			<QuizFooter
				stepIndex={stepIndex}
				totalSteps={totalSteps}
				canContinue={currentQ.type === "text" ? true : canContinue}
				isLastStep={isLastStep}
				onNext={handleNext}
			/>
		</div>
	);
}
