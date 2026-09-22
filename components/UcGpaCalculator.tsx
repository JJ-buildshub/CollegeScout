"use client";

import { AlertCircle, ExternalLink } from "lucide-react";
import { ucMinimumStatus } from "@/lib/gpa";

const UC_GPA_REQUIREMENT_URL =
  "https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/gpa-requirement.html";

/**
 * Deliberately not a calculator. UC's real GPA formula only awards its
 * honors bonus point for a semester completed with a C or better ("grades of
 * D or F in an honors course do not earn an extra point," per UC's own page)
 * — a per-course check this app has no course-level grade data to make. An
 * earlier version of this component asked for aggregate semester/honors
 * counts and computed a capped GPA from them, which could not enforce that
 * rule and was removed in the 2026-09-21 QA pass (see the note on
 * calculateUcCappedGpa in lib/gpa.ts). This shows only what we can say
 * honestly: the plain unweighted GPA against UC's minimum, with a link to
 * UC's own page for the real calculation.
 */
export default function UcGpaCalculator({
  cumulativeUnweighted,
  homeState,
}: {
  cumulativeUnweighted: number | null;
  homeState: string | null;
}) {
  if (cumulativeUnweighted === null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-400">
        Enter at least one year of unweighted GPA above to compare against UC&apos;s minimum.
      </div>
    );
  }

  const isCaliforniaOrUnknown = homeState === "CA" || homeState === null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <h2 className="text-sm font-bold text-navy-900">Applying to a UC? Your real UC GPA needs course-level grades.</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            UC adds one bonus point per Honors/AP/IB semester — but only for a semester you completed with a
            C or better, checked course by course (at most 8 bonus semesters total, at most 4 from 10th
            grade). That per-course check needs your actual course grades, which this profile doesn&apos;t
            collect, so we don&apos;t compute a bonus-inclusive number here — showing one without it would risk
            looking more precise than it is.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-navy-900 p-4 text-white">
        <div className="text-xs font-semibold tracking-wide text-slate-300">Your unweighted GPA (no honors bonus)</div>
        <div className="mt-1 text-3xl font-extrabold text-gold-400">{cumulativeUnweighted.toFixed(2)}</div>
        <p className="mt-2 text-xs leading-snug text-slate-300">{ucMinimumStatus(cumulativeUnweighted, isCaliforniaOrUnknown)}</p>
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          UC schools below are compared against your unweighted GPA only — an undercount versus your real UC
          GPA if you&apos;ve taken Honors/AP/IB courses, never an inflated guess.
        </p>
      </div>

      <a
        href={UC_GPA_REQUIREMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-navy-700"
      >
        Calculate your exact UC GPA on UC&apos;s official page <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
