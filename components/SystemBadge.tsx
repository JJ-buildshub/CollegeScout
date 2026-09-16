import clsx from "clsx";
import type { CollegeSystem } from "@/lib/types";

const SYSTEM_STYLES: Record<CollegeSystem, string> = {
  UC: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  CSU: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Private: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  "Out-of-State Public": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

export default function SystemBadge({ system, className }: { system: CollegeSystem; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        SYSTEM_STYLES[system],
        className
      )}
    >
      {system}
    </span>
  );
}
