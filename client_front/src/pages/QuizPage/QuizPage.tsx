import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ChoiceQuestionStep } from "./components/ChoiceQuestionStep";
import { NumberQuestionStep } from "./components/NumberQuestionStep";
import { QuizFooter } from "./components/QuizFooter";
import { QuizHeader } from "./components/QuizHeader";
import { HARD_CODED_QUIZ_QUESTIONS } from "./mockQuizConfig";
import type { AnswerValue } from "./types";
import {
	buildInitialAnswers,
	getVisibleQuestions,
	isQuestionAnswered,
	resolveDynamicText,
} from "./utils";

export default function QuizPage() {
	const navigate = useNavigate();

	// TODO: Replace hardcoded questions with backend quiz template.
	const allQuestions = HARD_CODED_QUIZ_QUESTIONS;

	// TODO: Replace hardcoded initial answers with backend prefilled profile answers.
	const [answers, setAnswers] = useState(() => buildInitialAnswers(allQuestions));
	const [stepIndex, setStepIndex] = useState(0);
	const [invalidQuestionId, setInvalidQuestionId] = useState<string | null>(null);

	const visibleQuestions = useMemo(
		() => getVisibleQuestions(allQuestions, answers),
		[allQuestions, answers],
	);
	const totalSteps = visibleQuestions.length;

	useEffect(() => {
		if (stepIndex <= totalSteps - 1) return;
		setStepIndex(Math.max(totalSteps - 1, 0));
	}, [stepIndex, totalSteps]);

	const currentQuestion = visibleQuestions[stepIndex];

	function setAnswer(questionId: string, next: AnswerValue) {
		setAnswers((prev) => ({ ...prev, [questionId]: next }));
		if (invalidQuestionId === questionId) {
			setInvalidQuestionId(null);
		}
	}

	function handleBack() {
		if (stepIndex === 0) {
			navigate("/");
			return;
		}
		setInvalidQuestionId(null);
		setStepIndex((prev) => prev - 1);
	}

	function handleNext() {
		if (!currentQuestion) return;
		const isLastStep = stepIndex === totalSteps - 1;
		const canContinue = isQuestionAnswered(currentQuestion, answers[currentQuestion.id]);
		if (!canContinue) {
			setInvalidQuestionId(currentQuestion.id);
			toast.error("Ви не обрали категорію. Оберіть варіант, щоб продовжити.");
			return;
		}

		if (isLastStep) {
			navigate("/result");
			return;
		}
		setStepIndex((prev) => prev + 1);
	}

	if (!currentQuestion) {
		return (
			<div className="min-h-screen bg-[#f4faf6] text-[#173325]">
				<QuizHeader stepIndex={0} totalSteps={1} onBack={() => navigate("/")} />
				<main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-4 pt-6">
					<div className="rounded-2xl border border-[#d7e9dd] bg-white p-5">
						<h1 className="text-[24px] font-semibold">Немає доступних питань</h1>
						<p className="mt-2 text-[14px] text-[#547161]">
							Перевірте конфіг опитування або умови відображення.
						</p>
					</div>
				</main>
			</div>
		);
	}

	const canContinue = isQuestionAnswered(currentQuestion, answers[currentQuestion.id]);
	const isLastStep = stepIndex === totalSteps - 1;
	const infoTitle = resolveDynamicText(currentQuestion.infoTitle, answers);
	const infoDescription = resolveDynamicText(currentQuestion.infoDescription, answers);
	const hasCurrentError = invalidQuestionId === currentQuestion.id;

	return (
		<div className="min-h-screen bg-[#f4faf6] text-[#173325]">
			<QuizHeader
				stepIndex={stepIndex}
				totalSteps={totalSteps}
				onBack={handleBack}
			/>

			<main
				className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-4 pt-6"
				style={{ paddingBottom: "calc(8.8rem + env(safe-area-inset-bottom))" }}
			>
					{currentQuestion.type === "number" ? (
						<NumberQuestionStep
							question={currentQuestion}
							value={Number(answers[currentQuestion.id] ?? currentQuestion.min)}
							infoTitle={infoTitle}
							infoDescription={infoDescription}
							hasError={hasCurrentError}
							onChange={(next) => setAnswer(currentQuestion.id, next)}
						/>
					) : (
						<ChoiceQuestionStep
							question={currentQuestion}
							answers={answers}
							infoTitle={infoTitle}
							infoDescription={infoDescription}
							hasError={hasCurrentError}
							onChange={(next) => setAnswer(currentQuestion.id, next)}
						/>
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
