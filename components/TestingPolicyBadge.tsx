import clsx from "clsx";
import type { TestingPolicy } from "@/lib/types";

const META: Record<TestingPolicy, { style: string; note: string }> = {
  "Test-Required": {
    style: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    note: "Scores are required for both admission and merit-aid review.",
  },
  "Test-Optional": {
    style: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    note: "Optional for admission, but a strong score can still strengthen your merit-aid case.",
  },
  "Test-Free": {
    style: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    note: "Scores aren't considered for admission or merit aid here, even if submitted.",
  },
  "Test-Blind": {
    style: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    note: "Scores are never considered, for admission or merit aid, even if you submit them.",
  },
};

export default function TestingPolicyBadge({
  policy,
  className,
}: {
  policy: TestingPolicy;
  className?: string;
}) {
  const meta = META[policy];
  return (
    <span
      title={meta.note}
      className={clsx(
        "inline-flex cursor-help items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.style,
        className
      )}
    >
      {policy}
    </span>
  );
}
