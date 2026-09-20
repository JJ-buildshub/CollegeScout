import Link from "next/link";
import { MapPin } from "lucide-react";
import type { FitResult } from "@/lib/types";
import { displayedAdmitRate } from "@/lib/colleges";
import { personalizeForAudience, type PlanningFor } from "@/lib/gpa";
import { SYSTEM_ACCENT } from "./SystemBadge";
import SaveToggleButton from "./SaveToggleButton";

/**
 * A mid-50% range bar with the student's marker. The domain always covers
 * both the range and the student's value, then pads both ends — proportional
 * to how wide that combined span is, with a floor so a student just outside a
 * tight band still reads as clearly separate from it rather than looking like
 * it overlaps (e.g. 3.70 vs. a 3.75-3.98 range needs a real visible gap, not
 * just a nonzero one).
 */
function RangeBar({
  low,
  high,
  value,
  minPadding,
  format,
}: {
  low: number;
  high: number;
  value: number;
  minPadding: number;
  format: (v: number) => string;
}) {
  const rawLow = Math.min(low, value);
  const rawHigh = Math.max(high, value);
  const rawSpan = Math.max(rawHigh - rawLow, 0.01);
  const padding = Math.max(rawSpan * 0.15, minPadding);
  const domainLow = rawLow - padding;
  const domainSpan = Math.max(rawHigh + padding - domainLow, 0.01);
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - domainLow) / domainSpan) * 100))}%`;

  return (
    <>
      <div className="relative mt-1.5 h-2 rounded-full bg-slate-100">
        <div
          className="absolute h-2 rounded-full bg-slate-300"
          style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
        />
        <div className="absolute -top-1 h-4 w-1 rounded-full bg-navy-900" style={{ left: pct(value) }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{format(low)}</span>
        <span>mid-50% range</span>
        <span>{format(high)}</span>
      </div>
    </>
  );
}

export default function FitCollegeCard({
  result,
  planningFor = "self",
}: {
  result: FitResult;
  planningFor?: PlanningFor;
}) {
  const { college, studentGpaUsed, gpaMetricLabel, rangeLow, rangeHigh, reason, sat, satNote } = result;
  const hasRange = rangeLow !== null && rangeHigh !== null;
  const accent = SYSTEM_ACCENT[college.system];
  const admitPct = Math.round(displayedAdmitRate(college).value * 100);

  return (
    <Link
      href={`/directory/${college.id}`}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className={`h-1 ${accent.edge}`} />
      <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-[11px] font-bold tracking-wide ${accent.text}`}>{college.system}</span>
          <h3 className="mt-0.5 text-sm font-extrabold leading-snug text-navy-900">{college.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" /> {college.location}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SaveToggleButton collegeId={college.id} />
          <div className="text-right leading-none">
            <span className="text-2xl font-black tabular-nums tracking-tight text-navy-900">
              {admitPct}
              <span className="text-base">%</span>
            </span>
            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">admitted</div>
          </div>
        </div>
      </div>

      {(hasRange || !sat) && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>{gpaMetricLabel}</span>
            <span>
              {planningFor === "student" ? "Your student:" : "You:"}{" "}
              <span className="font-bold text-navy-900">{studentGpaUsed.toFixed(2)}</span>
            </span>
          </div>
          {hasRange && (
            <RangeBar
              low={rangeLow}
              high={rangeHigh}
              value={studentGpaUsed}
              minPadding={0.05}
              format={(v) => v.toFixed(2)}
            />
          )}
        </div>
      )}

      {sat && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>SAT score</span>
            <span>
              {planningFor === "student" ? "Your student:" : "You:"}{" "}
              <span className="font-bold text-navy-900">{sat.score}</span>
            </span>
          </div>
          <RangeBar low={sat.low} high={sat.high} value={sat.score} minPadding={20} format={(v) => String(v)} />
        </div>
      )}

      <p className="mt-3 text-xs leading-snug text-slate-500">
        {personalizeForAudience(reason, planningFor)}
      </p>
      {satNote && (
        <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] leading-snug text-slate-500">
          {personalizeForAudience(satNote, planningFor)}
        </p>
      )}
      </div>
    </Link>
  );
}
