import { useEffect, useState } from "react";
import { ROUTES } from "@/consts/routes";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { QuizFooter } from "./components/QuizFooter";
import { QuizHeader } from "./components/QuizHeader";
import { getActiveFlow } from "@/api/requests";
import type { Flow } from "@/types/flow";
import { Loader2, Sparkles } from "lucide-react";
import { SingleChoiceBlock } from "./components/SingleChoiceBlock";
import { MultiChoiceBlock } from "./components/MultiChoiceBlock";
import { NumberChoiceBlock } from "./components/NumberChoiceBlock";

export default function QuizPage() {
	const navigate = useNavigate();

	const [flow, setFlow] = useState<Flow | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
	const [history, setHistory] = useState<number[]>([]); // стек question_id для back
	const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
	const [collectedAttributes, setCollectedAttributes] = useState<number[]>([]);
	const [invalidQuestionId, setInvalidQuestionId] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			const result = await getActiveFlow();
			if (!result.success) {
				toast.error("Cannot get quiz questions!");
				return;
			}
			setFlow(result.data);
			setCurrentQuestionId(result.data.start_question_id);
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

	if (!flow || currentQuestionId === null) return null;

	const sortedQuestions = [...flow.questions].sort((a, b) => a.position - b.position);
	const totalSteps = sortedQuestions.filter((q) => q.question.type !== "text").length;
	const stepIndex = history.length;

	const currentFlowQ = flow.questions.find((q) => q.question.id === currentQuestionId)!;
	const currentQ = currentFlowQ.question;

	const currentAnswer = answers[currentQ.id];
	const isMulti = currentQ.type === "multiple_choise";
	const isAnswered = isMulti ? Array.isArray(currentAnswer) && currentAnswer.length > 0 : currentAnswer !== undefined;
	const canContinue = currentQ.type === "text" || !currentQ.requires || isAnswered;
	const hasError = invalidQuestionId === currentQ.id;

	// знаходимо наступне питання через transitions
	function resolveNextQuestionId(selectedAnswerIds: number[]): number | null {
		const transitions = flow!.transitions
			.filter((t) => t.from_question_id === currentQ.id)
			.sort((a, b) => a.priority - b.priority);

		for (const transition of transitions) {
			if (transition.condition_type === "always") {
				return transition.to_question_id; // може бути null — це кінець
			}
			if (transition.condition_type === "answer_any") {
				const matches = transition.answer_ids.some((id) => selectedAnswerIds.includes(id));
				if (matches) return transition.to_question_id;
			}
			if (transition.condition_type === "answer_all") {
				const matches = transition.answer_ids.every((id) => selectedAnswerIds.includes(id));
				if (matches) return transition.to_question_id;
			}
		}

		return null; // немає transition — теж кінець
	}

	function getAnswerIds(): number[] {
		const answer = answers[currentQ.id];
		if (!answer) return [];
		return Array.isArray(answer) ? answer : [answer];
	}

	function getAttributesForAnswerIds(answerIds: number[]): number[] {
		return currentQ.answers.filter((a) => answerIds.includes(a.id)).flatMap((a) => a.attributes);
	}

	function handleBack() {
		setInvalidQuestionId(null);
		if (history.length === 0) {
			navigate(ROUTES.MAIN);
			return;
		}
		const prev = history[history.length - 1];
		setHistory((h) => h.slice(0, -1));
		setCurrentQuestionId(prev);
	}

	function handleNext() {
		if (!canContinue) {
			setInvalidQuestionId(currentQ.id);
			toast.error("Оберіть варіант, щоб продовжити.");
			return;
		}
		setInvalidQuestionId(null);

		const answerIds = getAnswerIds();
		const newAttributes = getAttributesForAnswerIds(answerIds);
		const updatedAttributes = [...collectedAttributes, ...newAttributes];
		setCollectedAttributes(updatedAttributes);

		const nextId = resolveNextQuestionId(answerIds);

		if (nextId === null) {
			navigate(ROUTES.RESULT, { state: { attributes: updatedAttributes } });
			return;
		}

		if (currentQuestionId != null) {
			setHistory((h) => [...h, currentQuestionId]);
		}
		setCurrentQuestionId(nextId);
	}

	const isLastStep = resolveNextQuestionId(getAnswerIds()) === null;

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
						<h2 className="text-[22px] font-semibold text-[#173325] leading-snug">{currentQ.text}</h2>
					</div>
				) : (
					<>
						<div className="mb-4">
							<h1 className="text-[40px] font-semibold leading-[1.05] tracking-tight text-[#173325]">{currentQ.text}</h1>
							{isMulti && <p className="text-[13px] text-[#547161] mt-3">Можна обрати кілька варіантів</p>}
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
							{currentQ.type === "manual_input" && (
								<NumberChoiceBlock
									question={currentQ}
									value={typeof answers[currentQ.id] === "number" ? Number(answers[currentQ.id]) : (currentQ.manual_input?.min ?? 0)}
									hasError={hasError}
									onChange={(val) => {
										setAnswers((a) => ({ ...a, [currentQ.id]: val }));
										setInvalidQuestionId(null);
									}}
								/>
							)}
						</div>
					</>
				)}
			</main>

			<QuizFooter
				stepIndex={stepIndex}
				totalSteps={totalSteps}
				canContinue={canContinue}
				isLastStep={isLastStep}
				onNext={handleNext}
			/>
		</div>
	);
}
