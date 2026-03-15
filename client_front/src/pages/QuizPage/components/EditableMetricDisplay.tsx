import { useEffect, useState } from "react";
import { clamp } from "@/utils/index";

interface EditableMetricDisplayProps {
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function EditableMetricDisplay({ value, unit }: EditableMetricDisplayProps) {
  return (
    <div className="mt-10 text-center">
      <div className="inline-flex items-end gap-2">
        <span className="text-[72px] font-semibold leading-none text-[#112e20]">{value}</span>
        {unit && <span className="mb-2 text-[30px] font-semibold text-[#296a49]">{unit}</span>}
      </div>
      <div className="mx-auto mt-3 h-px w-44 bg-[#d4e8dc]" />
    </div>
  );
}