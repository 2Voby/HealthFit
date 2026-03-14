import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	BadgeCheck,
	Clock3,
	Dumbbell,
	HeartPulse,
	House,
	Package,
	Sparkles,
	Zap,
} from "lucide-react";

type Product = {
	id: string;
	name: string;
	subtitle: string;
	price: string;
	icon: LucideIcon;
};

const RESULT = {
	badge: "Ваш результат",
	title: "Дякуємо за проходження опитування",
	subtitle: "Ось план, який найкраще вам підходить",
	planTitle: "Старт схуднення",
	type: "Дім",
	duration: "4 тижні",
	description:
		"Домашній план спалювання жиру з короткими тренуваннями з супроводом для початківців.",
	tags: ["Домашні тренування", "20–30 хв", "Підходить новачкам"],
};

const RECOMMENDED_PRODUCTS: Product[] = [
	{
		id: "resistance-bands",
		name: "Еспандери",
		subtitle: "Універсальна підтримка сили",
		price: "₴790",
		icon: Dumbbell,
	},
	{
		id: "jump-rope",
		name: "Скакалка",
		subtitle: "Швидкий кардіо-імпульс",
		price: "₴590",
		icon: Zap,
	},
	{
		id: "shaker-bottle",
		name: "Пляшка-шейкер",
		subtitle: "Зручна гідратація щодня",
		price: "₴490",
		icon: Package,
	},
	{
		id: "electrolytes-pack",
		name: "Набір електролітів",
		subtitle: "Щоденна підтримка відновлення",
		price: "₴650",
		icon: HeartPulse,
	},
];

export default function ResultPage() {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[#f4faf6] text-[#173325]">
			<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-[#bfe8cd]/70 blur-3xl" />
				<div className="absolute right-[-90px] top-24 h-64 w-64 rounded-full bg-[#d2f0dc]/70 blur-3xl" />
				<div className="absolute bottom-[-100px] left-[20%] h-64 w-64 rounded-full bg-[#e5f6ec] blur-3xl" />
			</div>

			<main className="mx-auto w-full max-w-[430px] px-4 pb-8 pt-5">
				<header className="mb-4">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1a7a4a]">
						<BadgeCheck className="h-3.5 w-3.5" />
						{RESULT.badge}
					</span>
					<h1 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-tight text-[#173325]">
						{RESULT.title}
					</h1>
					<p className="mt-2 text-[15px] text-[#3d5b49]">{RESULT.subtitle}</p>
				</header>

				<section className="relative overflow-hidden rounded-[30px] border border-[#cfe7d8] bg-gradient-to-br from-[#f3fbf6] via-[#ffffff] to-[#eaf7ef] p-5 shadow-[0_12px_35px_rgba(26,122,74,0.14)]">
					<div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#bfe8cd]/60 blur-2xl" />
					<div className="relative">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f7d53]">
									Персональний план
								</p>
								<h2 className="mt-1 text-[24px] font-semibold leading-tight text-[#173325]">
									{RESULT.planTitle}
								</h2>
							</div>
							<Sparkles className="h-5 w-5 text-[#2f7d53]" />
						</div>

						<p className="mt-3 text-sm leading-relaxed text-[#3f5f4b]">
							{RESULT.description}
						</p>

						<div className="mt-4 flex flex-wrap gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#f6fcf8] px-3 py-1.5 text-[11px] font-medium text-[#356c4d]">
								<House className="h-3.5 w-3.5" />
								{RESULT.type}
							</span>
							<span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#f6fcf8] px-3 py-1.5 text-[11px] font-medium text-[#356c4d]">
								<Clock3 className="h-3.5 w-3.5" />
								{RESULT.duration}
							</span>
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							{RESULT.tags.map((tag) => (
								<span
									key={tag}
									className="rounded-full bg-[#e8f4ed] px-3 py-1 text-[11px] font-medium text-[#356c4d]"
								>
									{tag}
								</span>
							))}
						</div>

						<button
							type="button"
							className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a7a4a] text-sm font-semibold text-white transition-colors hover:bg-[#155f3a]"
						>
							Продовжити
							<ArrowRight className="h-4 w-4" />
						</button>
					</div>
				</section>

				<section className="mt-5">
					<h3 className="mb-3 text-[20px] font-semibold leading-tight text-[#173325]">
						Рекомендовано для вас
					</h3>

					<div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
						{RECOMMENDED_PRODUCTS.map((product) => {
							const Icon = product.icon;

							return (
								<article
									key={product.id}
									className="w-[230px] shrink-0 snap-start rounded-[24px] border border-[#d4e9dc] bg-[#fbfefc] p-4 shadow-[0_8px_22px_rgba(26,122,74,0.1)]"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f3eb] text-[#1f7249]">
											<Icon className="h-5 w-5" />
										</div>
										<button
											type="button"
											className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#cfe4d7] bg-[#f6fcf8] text-[#2f6c4c] transition-colors hover:bg-[#eaf5ef]"
										>
											<ArrowRight className="h-4 w-4" />
										</button>
									</div>

									<h4 className="mt-4 text-[16px] font-semibold text-[#244233]">
										{product.name}
									</h4>
									<p className="mt-1 text-[13px] text-[#4f6b5b]">{product.subtitle}</p>
									<p className="mt-3 text-sm font-semibold text-[#1f5f3f]">
										{product.price}
									</p>
								</article>
							);
						})}
					</div>
				</section>
			</main>
		</div>
	);
}
