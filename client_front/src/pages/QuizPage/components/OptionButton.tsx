interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  hasError: boolean;
  multiple?: boolean;
  onClick: () => void;
}

export function OptionButton({ label, description, selected, hasError, multiple = false, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[22px] border p-4 text-left transition-all ${
        selected
          ? "border-[#1a7a4a] bg-[#eaf7ef] shadow-[0_8px_20px_rgba(26,122,74,0.18)]"
          : hasError
            ? "border-[#e38d8d] bg-[#fff7f7]"
            : "border-[#d4e8db] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-[#153624]">{label}</p>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-[#547161]">{description}</p>
          )}
        </div>

        {multiple ? (
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 ${
              selected ? "border-[#1a7a4a] bg-[#1a7a4a]" : "border-[#bdd8c9] bg-white"
            }`}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
        ) : (
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? "border-[#1a7a4a] bg-[#1a7a4a]" : "border-[#bdd8c9] bg-white"
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
        )}
      </div>
    </button>
  );
}