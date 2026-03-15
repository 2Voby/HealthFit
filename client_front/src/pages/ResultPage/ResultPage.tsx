import { useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, Loader2, Package, Sparkles } from "lucide-react";
import { getSuggestedOffer } from "@/api/requests";
import type { OfferSelectionResponse } from "@/types/offer";

function translateReasoning(r: string): string {
	if (r.startsWith("requires_all matched")) return r.replace("requires_all matched", "Обов'язкові атрибути");
	if (r.startsWith("requires_optional matched")) return r.replace("requires_optional matched", "Додаткові атрибути");
	if (r.startsWith("excludes matched")) return r.replace("excludes matched", "Виключені атрибути");
	return r;
}

function shouldShowReasoning(r: string): boolean {
	return (
		!r.startsWith("requires_optional coverage") &&
		!r.startsWith("fallback") &&
		!r.startsWith("missing_requires_all") &&
		!r.startsWith("hit_excluded")
	);
}

function PaymentSuccess({ onClose }: { onClose: () => void }) {
	const navigate = useNavigate();
	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
			<div className="w-full max-w-[430px] rounded-[32px] bg-white p-6 shadow-2xl">
				<div className="flex flex-col items-center text-center gap-3">
					<div className="w-16 h-16 rounded-full bg-[#e6f4ec] flex items-center justify-center">
						<CheckCircle2 className="w-9 h-9 text-[#1a7a4a]" />
					</div>
					<h2 className="text-[22px] font-semibold text-[#173325]">Оплата успішна</h2>
					<p className="text-[14px] text-[#547161] leading-relaxed">
						Ваш план і wellness kit вже оформлені. Очікуйте на підтвердження на email.
					</p>
				</div>

				<div className="mt-5 rounded-2xl bg-[#f4faf6] border border-[#d7e9dd] p-4 space-y-2">
					<div className="flex items-center justify-between text-[13px]">
						<span className="text-[#547161]">Статус</span>
						<span className="font-semibold text-[#1a7a4a]">Підтверджено</span>
					</div>
					<div className="flex items-center justify-between text-[13px]">
						<span className="text-[#547161]">Доставка</span>
						<span className="font-medium text-[#173325]">2–4 робочі дні</span>
					</div>
					<div className="flex items-center justify-between text-[13px]">
						<span className="text-[#547161]">Підтримка</span>
						<span className="font-medium text-[#173325]">support@formfit.app</span>
					</div>
				</div>

				<button
					type="button"
					onClick={() => {
						onClose();
						navigate("/");
						return;
					}}
					className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a7a4a] text-[15px] font-semibold text-white transition-colors hover:bg-[#155f3a] active:scale-[0.98]">
					Чудово!
				</button>
			</div>
		</div>
	);
}

export default function ResultPage() {
	const { state } = useLocation();
	const attributes: number[] = state?.attributes ?? [];

	const [offerData, setOfferData] = useState<OfferSelectionResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [showPayment, setShowPayment] = useState(false);

	useEffect(() => {
		async function load() {
			if (attributes.length === 0) {
				setLoading(false);
				return;
			}
			const result = await getSuggestedOffer(attributes);
			if (result.success) setOfferData(result.data);
			setLoading(false);
		}
		load();
	}, []);

	const topOffer = offerData?.items[0];

	return (
		<>
			{showPayment && <PaymentSuccess onClose={() => setShowPayment(false)} />}

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
							Ваш результат
						</span>
						<h1 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-tight text-[#173325]">
							Дякуємо за проходження опитування
						</h1>
						<p className="mt-2 text-[15px] text-[#3d5b49]">Ось план, який найкраще вам підходить</p>
					</header>

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-[#1a7a4a]" />
						</div>
					) : !topOffer ? (
						<div className="rounded-2xl border border-[#d7e9dd] bg-white p-5 text-center text-[14px] text-[#547161]">
							Не вдалося знайти відповідний план. Спробуйте пройти опитування ще раз.
						</div>
					) : (
						<>
							<section className="relative overflow-hidden rounded-[30px] border border-[#cfe7d8] bg-gradient-to-br from-[#f3fbf6] via-[#ffffff] to-[#eaf7ef] p-5 shadow-[0_12px_35px_rgba(26,122,74,0.14)]">
								<div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#bfe8cd]/60 blur-2xl" />
								<div className="relative">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f7d53]">Персональний план</p>
											<h2 className="mt-1 text-[22px] font-semibold leading-tight text-[#173325]">{topOffer.offer.name}</h2>
										</div>
										<Sparkles className="h-5 w-5 shrink-0 text-[#2f7d53]" />
									</div>

									<p className="mt-3 text-sm leading-relaxed text-[#3f5f4b] whitespace-pre-line">{topOffer.offer.description}</p>

									<div className="mt-4 flex flex-wrap gap-2">
										<span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#f6fcf8] px-3 py-1.5 text-[11px] font-medium text-[#356c4d]">
											<Clock3 className="h-3.5 w-3.5" />
											{topOffer.offer.price} USD
										</span>
										<span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#f6fcf8] px-3 py-1.5 text-[11px] font-medium text-[#356c4d]">
											Збіг: {Math.round(topOffer.optional_coverage * 100)}%
										</span>
									</div>

									<div className="mt-4 space-y-1">
										{topOffer.reasoning.filter(shouldShowReasoning).map((r, i) => (
											<p key={i} className="text-[11px] text-[#547161]">
												• {translateReasoning(r)}
											</p>
										))}
									</div>

									<button
										type="button"
										onClick={() => setShowPayment(true)}
										className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a7a4a] text-[15px] font-semibold text-white transition-all hover:bg-[#155f3a] active:scale-[0.98] shadow-[0_6px_20px_rgba(26,122,74,0.35)]">
										Придбати план
										<ArrowRight className="h-4 w-4" />
									</button>
								</div>
							</section>

							<section className="mt-4 rounded-[24px] border border-[#d4e9dc] bg-white overflow-hidden shadow-[0_8px_22px_rgba(26,122,74,0.08)]">
								{topOffer.offer.wellness_kit_image_url && (
									<img
										src={topOffer.offer.wellness_kit_image_url}
										alt={topOffer.offer.wellness_kit_name}
										className="w-full h-[180px] object-cover"
									/>
								)}
								<div className="p-4">
									<div className="flex items-center gap-2 mb-2">
										<div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#e7f3eb] text-[#1f7249]">
											<Package className="h-4 w-4" />
										</div>
										<p className="text-[11px] font-semibold uppercase tracking-wider text-[#2f7d53]">Physical Wellness Kit</p>
									</div>
									<h3 className="text-[18px] font-semibold text-[#173325]">{topOffer.offer.wellness_kit_name}</h3>
									<p className="mt-1 text-[13px] leading-relaxed text-[#4f6b5b]">{topOffer.offer.wellness_kit_description}</p>
								</div>
							</section>

							{offerData!.items.length > 1 && (
								<section className="mt-5">
									<h3 className="mb-3 text-[18px] font-semibold text-[#173325]">Інші варіанти</h3>
									<div className="flex flex-col gap-3">
										{offerData!.items.slice(1).map(({ offer, optional_coverage }) => (
											<div key={offer.id} className="rounded-2xl border border-[#d4e9dc] bg-white p-4">
												<div className="flex items-start justify-between gap-2">
													<p className="text-[14px] font-semibold text-[#244233]">{offer.name}</p>
													<span className="shrink-0 text-[11px] text-[#547161]">{Math.round(optional_coverage * 100)}%</span>
												</div>
												<p className="mt-1 text-[12px] text-[#4f6b5b]">{offer.wellness_kit_name}</p>
												<p className="mt-1 text-[12px] text-[#4f6b5b]">{offer.price} USD</p>
											</div>
										))}
									</div>
								</section>
							)}
						</>
					)}
				</main>
			</div>
		</>
	);
}
