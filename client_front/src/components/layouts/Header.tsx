export default function Header() {
	return (
		<>
			<div className="relative h-[80px] overflow-hidden">
				<div
					className="absolute inset-0"
					style={{
						background: "linear-gradient(135deg, #2563eb 0%, #1a7a4a 65%, #15803d 100%)",
						borderRadius: "0 0 44% 44% / 0 0 32px 32px",
					}}
				/>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-8" />
					<div className="flex items-center gap-2">
						<svg width="22" height="22" viewBox="0 0 32 32" fill="none">
							<rect x="2" y="13" width="6" height="6" rx="2" fill="white" opacity="0.9" />
							<rect x="24" y="13" width="6" height="6" rx="2" fill="white" opacity="0.9" />
							<rect x="6" y="11" width="4" height="10" rx="1.5" fill="white" />
							<rect x="22" y="11" width="4" height="10" rx="1.5" fill="white" />
							<rect x="10" y="14.5" width="12" height="3" rx="1.5" fill="white" />
						</svg>
						<span className="text-white text-[20px] font-bold tracking-wide">HealthFit</span>
					</div>
				</div>
			</div>
		</>
	);
}