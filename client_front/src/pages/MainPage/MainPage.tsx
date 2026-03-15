import { Button } from "@/components/ui/button";
import { ROUTES } from "@/consts/routes";
import { useNavigate } from "react-router-dom";
import { Target, Salad, TrendingUp, Moon, Flame, Brain, Zap, Timer } from "lucide-react";

const stats = [
	{ value: "4.9", label: "Середня оцінка*" },
	{ value: "94%", label: "Досягають мети" },
	{ value: "8+", label: "Персональних планів" },
];

const perks = [
	{ icon: Target, text: "Персональна програма під твої цілі" },
	{ icon: Salad, text: "Поради з харчування та відновлення" },
	{ icon: TrendingUp, text: "Адаптується до твого рівня" },
	{ icon: Moon, text: "Режим сну та відновлення" },
	{ icon: Flame, text: "Спалення калорій під твій темп" },
	{ icon: Brain, text: "Баланс тіла і ментального здоров'я" },
	{ icon: Zap, text: "Щотижневий прогрес і мотивація" },
];

const avatars = ["АН", "МС", "ОК", "ДТ"];

function PerkCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
	return (
		<div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 shrink-0 w-[230px]">
			<div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
				<Icon className="w-4 h-4 text-[#1a7a4a]" />
			</div>
			<span className="text-[12px] text-gray-700 font-semibold leading-snug">{text}</span>
		</div>
	);
}

export default function MainPage() {
	const navigate = useNavigate();
	const doubled = [...perks, ...perks];

	return (
		<div className="min-h-screen bg-white flex flex-col">
			<style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          gap: 10px;
          width: max-content;
          animation: marquee 22s linear infinite;
        }
      `}</style>

			<div className="px-5 pt-7 pb-2 max-w-lg mx-auto w-full">
				<h1 className="text-[32px] font-black text-gray-900 leading-[1.1] tracking-tight uppercase mb-2">
					Тренування
					<br />
					для тебе
				</h1>
				<p className="text-[11px] font-bold tracking-[0.12em] text-gray-400 uppercase mb-6">Обери свій рівень, та отримай персональний план</p>

				{/* Marquee */}
				<div className="overflow-hidden mb-5 -mx-5">
					<div className="marquee-track px-5">
						{doubled.map((p, i) => (
							<PerkCard key={i} icon={p.icon} text={p.text} />
						))}
					</div>
				</div>

				{/* Social proof */}
				<div className="flex items-center gap-2 mb-4">
					<div className="flex">
						{avatars.map((av, i) => (
							<div
								key={i}
								className="w-[26px] h-[26px] rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white bg-[#1a7a4a]"
								style={{ marginLeft: i === 0 ? 0 : -7 }}>
								{av}
							</div>
						))}
					</div>
					<p className="text-[12px] text-gray-500 font-medium leading-snug">
						<strong className="text-gray-900">Оля щойно отримала свій план</strong> · 3 хв тому
					</p>
				</div>

				{/* Urgency */}
				<div className="flex items-start gap-2 bg-[#eff6ff] rounded-xl px-4 py-3 mb-5">
					<Timer className="w-5 h-5 text-[#1d4ed8] shrink-0 mt-0.5" />
					<p className="text-[13px] text-[#1d4ed8] leading-snug">
						<strong>Займе зовсім небагато часу</strong> — більшість встигають до кінця кави ☕
					</p>
				</div>

				{/* CTA */}
			<Button
  onClick={() => navigate(ROUTES.QUIZ)}
  className="w-full bg-[#15803d] hover:bg-[#166534] active:scale-[0.98] text-white rounded-2xl py-4 h-auto text-[15px] font-bold shadow-none border-none transition-all tracking-wide"
>
  Почати квіз →
</Button>
				<p className="text-center text-[11px] text-gray-400 mt-3 leading-relaxed px-2">
					Натискаючи кнопку, ви погоджуєтесь з <span className="text-[#1a7a4a] font-medium cursor-pointer">Умовами сервісу</span>{" "}
					| <span className="text-[#1a7a4a] font-medium cursor-pointer">Політикою конфіденційності</span>
				</p>

				{/* Stats */}
				<div className="flex justify-around pt-6 mt-4 border-t border-gray-100">
					{stats.map((s) => (
						<div key={s.value} className="text-center">
							<div className="text-[22px] font-black text-[#1a7a4a]">{s.value}</div>
							<div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 leading-tight">{s.label}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
