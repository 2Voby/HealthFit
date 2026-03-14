import { ArrowLeft } from "lucide-react";

interface QuizHeaderProps {
	stepIndex: number;
	totalSteps: number;
	onBack: () => void;
}

export function QuizHeader({ stepIndex, totalSteps, onBack }: QuizHeaderProps) {
	return (
		<header className="sticky top-0 z-30 border-b border-[#d8eadd] bg-[#f4faf6]/95 backdrop-blur">
			<div className="mx-auto w-full max-w-[430px] px-4 pb-3 pt-4">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onBack}
						className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cfe4d7] bg-white text-[#1c6b45]"
					>
						<ArrowLeft className="h-4.5 w-4.5" />
					</button>

					<div className="flex-1">
						<p className="text-center text-[14px] font-semibold text-[#1f4d35]">
							{stepIndex >= 2 ? "Майже готово" : "Про вас"}
						</p>
						<div className="mt-2 flex gap-1.5">
							{Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
								<div key={i} className="h-1.5 flex-1 rounded-full bg-[#dbeade]">
									<div
										className="h-full rounded-full bg-[#1a7a4a] transition-all duration-300"
										style={{ width: i < stepIndex ? "100%" : i === stepIndex ? "55%" : "0%" }}
									/>
								</div>
							))}
						</div>
					</div>

					<div className="w-9 shrink-0" />
				</div>
			</div>
		</header>
	);
}
