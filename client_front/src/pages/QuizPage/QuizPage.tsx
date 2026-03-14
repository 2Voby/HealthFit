import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ── Quiz data ──────────────────────────────────────────────
const questions = [
	{
		id: 1,
		title: "Яка твоя головна ціль?",
		subtitle: "Обери один варіант",
		type: "single",
		options: [
			{ icon: "⚖️", label: "Схуднути" },
			{ icon: "💪", label: "Набрати м'язову масу" },
			{ icon: "🤸", label: "Розвинути гнучкість" },
			{ icon: "🧘", label: "Зменшити стрес" },
			{ icon: "🏃", label: "Покращити витривалість" },
		],
	},
	{
		id: 2,
		title: "Який твій рівень підготовки?",
		subtitle: "Будь чесним — від цього залежить план",
		type: "single",
		options: [
			{ icon: "🌱", label: "Початківець" },
			{ icon: "🔄", label: "Займаюсь зрідка" },
			{ icon: "📅", label: "Тренуюсь регулярно" },
			{ icon: "🏆", label: "Досвідчений спортсмен" },
		],
	},
	{
		id: 3,
		title: "Скільки разів на тиждень ти готовий тренуватись?",
		subtitle: "Обери реальну цифру",
		type: "single",
		options: [
			{ icon: "1️⃣", label: "1–2 рази" },
			{ icon: "3️⃣", label: "3–4 рази" },
			{ icon: "5️⃣", label: "5+ разів" },
			{ icon: "📆", label: "Щодня" },
		],
	},
	{
		id: 4,
		title: "Де ти плануєш тренуватись?",
		subtitle: "Можна обрати кілька",
		type: "multi",
		options: [
			{ icon: "🏠", label: "Вдома" },
			{ icon: "🏋️", label: "У залі" },
			{ icon: "🌳", label: "На вулиці" },
			{ icon: "✈️", label: "У подорожах" },
		],
	},
	{
		id: 5,
		title: "Скільки тобі років?",
		subtitle: "Вік впливає на інтенсивність програми",
		type: "single",
		options: [
			{ icon: "🔥", label: "18–29" },
			{ icon: "💼", label: "30–39" },
			{ icon: "🌿", label: "40–49" },
			{ icon: "⭐", label: "50+" },
		],
	},
];

// ── Types ──────────────────────────────────────────────────
type Answers = Record<number, string[]>;

// ── Option row ─────────────────────────────────────────────
function OptionRow({
	icon,
	label,
	selected,
	type,
	onToggle,
}: {
	icon: string;
	label: string;
	selected: boolean;
	type: "single" | "multi";
	onToggle: () => void;
}) {
	return (
		<button
			onClick={onToggle}
			className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all text-left ${
				selected
					? "border-[#1a7a4a] bg-[#f0faf4]"
					: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
			}`}
		>
			{/* Icon bubble */}
			<span
				className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
					selected ? "bg-[#1a7a4a]/10" : "bg-gray-100"
				}`}
			>
				{icon}
			</span>

			{/* Label */}
			<span className={`flex-1 text-[15px] font-medium ${selected ? "text-[#1a7a4a]" : "text-gray-800"}`}>
				{label}
			</span>

			{/* Indicator */}
			{type === "single" ? (
				<span
					className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
						selected ? "border-[#1a7a4a]" : "border-gray-300"
					}`}
				>
					{selected && <span className="w-2.5 h-2.5 rounded-full bg-[#1a7a4a]" />}
				</span>
			) : (
				<span
					className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
						selected ? "border-[#1a7a4a] bg-[#1a7a4a]" : "border-gray-300"
					}`}
				>
					{selected && (
						<svg width="11" height="9" viewBox="0 0 11 9" fill="none">
							<path d="M1 4l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					)}
				</span>
			)}
		</button>
	);
}

// ── Main component ─────────────────────────────────────────
export default function QuizPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Answers>({});
	const [done, setDone] = useState(false);

	const q = questions[step];
	const total = questions.length;
	const progress = ((step) / total) * 100;
	const current = answers[q.id] ?? [];

	function toggle(label: string) {
		if (q.type === "single") {
			setAnswers((a) => ({ ...a, [q.id]: [label] }));
		} else {
			setAnswers((a) => {
				const prev = a[q.id] ?? [];
				return {
					...a,
					[q.id]: prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
				};
			});
		}
	}

	function next() {
		if (step < total - 1) setStep((s) => s + 1);
		else setDone(true);
	}

	function back() {
		if (step > 0) setStep((s) => s - 1);
	}

	// ── Done screen ──
	if (done) {
		return (
			<div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
				<div className="text-6xl mb-5">🎉</div>
				<h2 className="text-[28px] font-black text-gray-900 uppercase tracking-tight mb-3">
					Твій план готовий!
				</h2>
				<p className="text-[15px] text-gray-500 leading-relaxed mb-8 max-w-xs">
					На основі твоїх відповідей ми підібрали персональну програму тренувань.
				</p>
				<Button
					onClick={() => navigate("/result")}
					className="w-full max-w-xs bg-[#1a7a4a] hover:bg-[#155f3a] text-white rounded-2xl py-4 h-auto text-[15px] font-bold shadow-none border-none"
				>
					Переглянути план →
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white flex flex-col">

			{/* ── Top nav ── */}
			<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
				<button
					onClick={back}
					className={`text-gray-500 transition-opacity ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}
				>
					<svg width="22" height="22" fill="none" viewBox="0 0 24 24">
						<path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>

				<span className="text-[15px] font-semibold text-gray-800">Мій профіль</span>

				<button className="text-gray-400">
					<svg width="22" height="22" fill="none" viewBox="0 0 24 24">
						<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
				</button>
			</div>

			{/* ── Progress bar ── */}
			<div className="px-5 pt-3 pb-0">
				<div className="flex gap-1.5">
					{questions.map((_, i) => (
						<div
							key={i}
							className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200"
						>
							<div
								className="h-full bg-[#1a7a4a] rounded-full transition-all duration-500"
								style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
							/>
						</div>
					))}
				</div>
			</div>

			{/* ── Question ── */}
			<div className="flex-1 px-5 pt-7 pb-8 flex flex-col max-w-lg mx-auto w-full">
				<h1 className="text-[26px] font-black text-gray-900 leading-[1.2] tracking-tight mb-1">
					{q.title}
				</h1>
				<p className="text-[13px] text-gray-400 uppercase tracking-[0.1em] font-semibold mb-6">
					{q.subtitle}
				</p>

				{/* Options */}
				<div className="flex flex-col gap-3 flex-1">
					{q.options.map((opt) => (
						<OptionRow
							key={opt.label}
							icon={opt.icon}
							label={opt.label}
							selected={current.includes(opt.label)}
							type={q.type as "single" | "multi"}
							onToggle={() => toggle(opt.label)}
						/>
					))}
				</div>

				{/* Next button */}
				<div className="mt-7">
					<Button
						onClick={next}
						disabled={current.length === 0}
						className="w-full bg-[#1a7a4a] hover:bg-[#155f3a] disabled:opacity-40 text-white rounded-2xl py-4 h-auto text-[15px] font-bold shadow-none border-none transition-all"
					>
						{step === total - 1 ? "Завершити →" : "Далі →"}
					</Button>
					<p className="text-center text-[12px] text-gray-400 mt-2">
						{step + 1} / {total}
					</p>
				</div>
			</div>
		</div>
	);
}
