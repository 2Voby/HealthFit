import { useEffect, useState } from "react";
import { clamp } from "@/utils/index";

interface EditableMetricDisplayProps {
	value: number;
	unit: string;
	min: number;
	max: number;
	onChange: (next: number) => void;
}

export function EditableMetricDisplay({
	value,
	unit,
	min,
	max,
	onChange,
}: EditableMetricDisplayProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(String(value));

	useEffect(() => {
		if (!isEditing) setDraft(String(value));
	}, [value, isEditing]);

	function commit() {
		const parsed = Number.parseInt(draft, 10);
		if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
		setIsEditing(false);
	}

	return (
		<div className="mt-10 text-center">
			{isEditing ? (
				<div className="inline-flex items-end gap-2">
					<input
						autoFocus
						type="number"
						inputMode="numeric"
						min={min}
						max={max}
						value={draft}
						onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
						onBlur={commit}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								commit();
							}
							if (e.key === "Escape") {
								setIsEditing(false);
							}
						}}
						className="w-[170px] border-none bg-transparent text-center text-[72px] font-semibold leading-none text-[#112e20] outline-none"
					/>
					<span className="mb-2 text-[30px] font-semibold text-[#296a49]">{unit}</span>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className="inline-flex items-end gap-2 rounded-xl"
				>
					<span className="text-[72px] font-semibold leading-none text-[#112e20]">{value}</span>
					<span className="mb-2 text-[30px] font-semibold text-[#296a49]">{unit}</span>
				</button>
			)}

			<div className="mx-auto mt-3 h-px w-44 bg-[#d4e8dc]" />
			<p className="mt-2 text-[12px] text-[#5d7b69]">Натисніть на число, щоб ввести вручну</p>
		</div>
	);
}
