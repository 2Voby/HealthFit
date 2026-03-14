import { Info } from "lucide-react";

interface InfoCardProps {
	title: string;
	description: string;
}

export function InfoCard({ title, description }: InfoCardProps) {
	return (
		<div className="mt-8 rounded-2xl border border-[#d7e9dd] bg-[#f2f8f4] p-4">
			<div className="flex items-start gap-3">
				<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5f1e9] text-[#1a7a4a]">
					<Info className="h-4 w-4" />
				</span>
				<div>
					<p className="text-[15px] font-semibold leading-snug text-[#193726]">{title}</p>
					<p className="mt-1 text-[13px] leading-relaxed text-[#56705f]">{description}</p>
				</div>
			</div>
		</div>
	);
}
