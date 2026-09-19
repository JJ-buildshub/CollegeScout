import Link from "next/link";
import { MapPin } from "lucide-react";
import type { FitResult } from "@/lib/types";
import { displayedAdmitRate, formatPercent } from "@/lib/colleges";
import { personalizeForAudience, type PlanningFor } from "@/lib/gpa";
import SystemBadge from "./SystemBadge";
import SaveToggleButton from "./SaveToggleButton";

export default function FitCollegeCard({
  result,
  planningFor = "self",
}: {
  result: FitResult;
  planningFor?: PlanningFor;
}) {
  const { college, studentGpaUsed, gpaMetricLabel, rangeLow, rangeHigh, reason } = result;
  const hasRange = rangeLow !== null && rangeHigh !== null;

  // Domain always covers both the range and the student's GPA, then pads
  // both ends — proportional to how wide that combined span is, with a
  // floor so a student just outside a tight band still reads as clearly
  // separate from it rather than looking like it overlaps (e.g. 3.70 vs.
  // a 3.75-3.98 range needs a real visible gap, not just a nonzero one).
  const rawLow = hasRange ? Math.min(rangeLow, studentGpaUsed) : 0;
  const rawHigh = hasRange ? Math.max(rangeHigh, studentGpaUsed) : 1;
  const rawSpan = Math.max(rawHigh - rawLow, 0.01);
  const padding = hasRange ? Math.max(rawSpan * 0.15, 0.05) : 0;
  const domainLow = rawLow - padding;
  const domainHigh = rawHigh + padding;
  const domainSpan = Math.max(domainHigh - domainLow, 0.01);
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - domainLow) / domainSpan) * 100))}%`;

  return (
    <Link
      href={`/directory/${college.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <SystemBadge system={college.system} />
          <h3 className="mt-2 text-sm font-bold leading-snug text-navy-900">{college.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" /> {college.location}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <SaveToggleButton collegeId={college.id} />
          <div className="whitespace-nowrap text-right text-xs font-semibold text-slate-400">
            {formatPercent(displayedAdmitRate(college).value)} overall admit
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-medium text-slate-400">
          <span>{gpaMetricLabel}</span>
          <span>
            {planningFor === "student" ? "Your student:" : "You:"}{" "}
            <span className="font-bold text-navy-900">{studentGpaUsed.toFixed(2)}</span>
          </span>
        </div>
        {hasRange ? (
          <>
            <div className="relative mt-1.5 h-2 rounded-full bg-slate-100">
              <div
                className="absolute h-2 rounded-full bg-slate-300"
                style={{ left: pct(rangeLow), width: `calc(${pct(rangeHigh)} - ${pct(rangeLow)})` }}
              />
              <div
                className="absolute -top-1 h-4 w-1 rounded-full bg-navy-900"
                style={{ left: pct(studentGpaUsed) }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>{rangeLow.toFixed(2)}</span>
              <span>mid-50% range</span>
              <span>{rangeHigh.toFixed(2)}</span>
            </div>
          </>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-snug text-slate-500">
        {personalizeForAudience(reason, planningFor)}
      </p>
    </Link>
  );
}
