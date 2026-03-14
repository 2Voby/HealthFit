import { Button } from "@/components/ui/button";

interface QuizFooterProps {
	stepIndex: number;
	totalSteps: number;
	canContinue: boolean;
	isLastStep: boolean;
	onNext: () => void;
}

export function QuizFooter({
	stepIndex,
	totalSteps,
	canContinue,
	isLastStep,
	onNext,
}: QuizFooterProps) {
	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40">
			<div
				className="mx-auto w-full max-w-[430px] px-4 pb-3"
				style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
			>
				<div className="rounded-[26px] border border-[#cfe5d8] bg-white/95 p-3 shadow-[0_-10px_28px_rgba(26,122,74,0.18)] backdrop-blur">
					<Button
						onClick={onNext}
						disabled={!canContinue}
						className="h-12 w-full rounded-2xl border-none bg-[#1a7a4a] text-[15px] font-semibold text-white hover:bg-[#155f3a] disabled:opacity-45"
					>
						{isLastStep ? "Переглянути план" : "Далі"}
					</Button>
					<p className="mt-2 text-center text-[11px] font-medium text-[#4f6f5c]">
						Крок {stepIndex + 1} з {totalSteps}
					</p>
				</div>
			</div>
		</footer>
	);
}
