import { useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { clamp } from "@/utils/index";

const WHEEL_ITEM_HEIGHT = 52;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const WHEEL_PADDING = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

interface NumberWheelProps {
	value: number;
	min: number;
	max: number;
	unit: string;
	onChange: (next: number) => void;
}

export function NumberWheel({ value, min, max, unit, onChange }: NumberWheelProps) {
	const numbers = useMemo(
		() => Array.from({ length: max - min + 1 }, (_, i) => min + i),
		[min, max],
	);
	const scrollerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = scrollerRef.current;
		if (!node) return;

		const target = (value - min) * WHEEL_ITEM_HEIGHT;
		if (Math.abs(node.scrollTop - target) < 1) return;
		// Keep wheel position deterministic to avoid value oscillation on click.
		node.scrollTop = target;
	}, [value, min]);

	function handleScroll() {
		const node = scrollerRef.current;
		if (!node) return;

		const rawIndex = node.scrollTop / WHEEL_ITEM_HEIGHT;
		const index = Math.round(rawIndex);
		const next = clamp(min + index, min, max);
		if (next === value) return;

		onChange(next);
	}

	return (
		<div className="relative mx-auto w-full max-w-[360px] rounded-[26px] border border-[#cde4d6] bg-white p-3 shadow-[0_10px_24px_rgba(26,122,74,0.12)]">
			<div className="pointer-events-none absolute inset-x-3 top-1/2 h-12 -translate-y-1/2 rounded-2xl bg-[#e8f4ed]" />
			<div className="pointer-events-none absolute inset-x-3 top-3 h-16 rounded-t-2xl bg-gradient-to-b from-white via-white/70 to-transparent" />
			<div className="pointer-events-none absolute inset-x-3 bottom-3 h-16 rounded-b-2xl bg-gradient-to-t from-white via-white/70 to-transparent" />

			<div className="relative grid grid-cols-[1fr_auto] items-center gap-3">
				<div
					ref={scrollerRef}
					onScroll={handleScroll}
					className="snap-y snap-mandatory overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
					style={{ height: `${WHEEL_HEIGHT}px` }}
				>
					<div style={{ height: `${WHEEL_PADDING}px` }} />
					{numbers.map((item) => {
						const selected = item === value;
						return (
							<button
								key={item}
								type="button"
								onClick={() => onChange(item)}
								className="flex w-full snap-center items-center justify-center gap-2 rounded-xl transition-colors"
								style={{ height: `${WHEEL_ITEM_HEIGHT}px` }}
							>
								<span
									className={`text-[34px] leading-none ${
										selected ? "font-semibold text-[#123825]" : "font-medium text-[#8da999]"
									}`}
								>
									{item}
								</span>
								<span
									className={`text-[18px] ${
										selected ? "font-semibold text-[#2b6e4d]" : "text-transparent"
									}`}
								>
									{unit}
								</span>
							</button>
						);
					})}
					<div style={{ height: `${WHEEL_PADDING}px` }} />
				</div>

				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={() => onChange(clamp(value - 1, min, max))}
						disabled={value >= max}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe3d7] bg-[#f3fbf6] text-[#256f4b] disabled:opacity-40"
					>
						<ChevronUp className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => onChange(clamp(value + 1, min, max))}
						disabled={value <= min}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe3d7] bg-[#f3fbf6] text-[#256f4b] disabled:opacity-40"
					>
						<ChevronDown className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
