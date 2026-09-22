import clsx from "clsx";
import type { SchoolStatus, ApplicationRound } from "@/lib/collegeList";
import { ROUND_LABELS } from "@/lib/collegeList";

const STATUS_STYLES: Record<SchoolStatus, string> = {
  Saved: "bg-slate-100 text-slate-600",
  Applying: "bg-amber-100 text-amber-700",
  Submitted: "bg-sky-100 text-sky-700",
  "Decision received": "bg-emerald-100 text-emerald-700",
};

/** The one status pill shown identically on Explore, My Fit, My Plan and a college's own profile page. */
export default function SchoolStatusBadge({
  status,
  round,
  className,
}: {
  status: SchoolStatus;
  round?: ApplicationRound | null;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLES[status], className)}>
      {status}
      {round && status !== "Saved" && <span className="font-semibold opacity-70">&middot; {ROUND_LABELS[round]}</span>}
    </span>
  );
}
