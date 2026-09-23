"use client";

import { Info } from "lucide-react";
import { GRADE_LABELS } from "@/lib/checklistData";
import { gpaYearsFor, type StudentProfile, type YearGpa } from "@/lib/profile";
import type { Grade } from "@/lib/types";

function YearRow({
  grade,
  entry,
  inProgress,
  onChange,
}: {
  grade: Grade;
  entry: YearGpa;
  inProgress: boolean;
  onChange: (entry: YearGpa) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
        {GRADE_LABELS[grade].split(" — ")[0]}
        {inProgress && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">In progress</span>
        )}
      </div>
      <label className="block">
        <div className="text-xs font-semibold text-slate-500">Unweighted GPA</div>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={4}
          step={0.01}
          value={entry.unweighted ?? ""}
          placeholder="e.g. 3.70"
          onChange={(e) => onChange({ ...entry, unweighted: e.target.value === "" ? null : parseFloat(e.target.value) })}
          className="mt-1 w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-gold-500"
        />
      </label>
      <label className="block">
        <div className="text-xs font-semibold text-slate-500">Weighted GPA (school-reported)</div>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={5.5}
          step={0.01}
          value={entry.weighted ?? ""}
          placeholder="Optional"
          onChange={(e) => onChange({ ...entry, weighted: e.target.value === "" ? null : parseFloat(e.target.value) })}
          className="mt-1 w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-gold-500"
        />
      </label>
    </div>
  );
}

/**
 * Per-year unweighted/weighted GPA entry. Only used for the student's own
 * cumulative-average trend — see lib/profile.ts's computeGpaSummary and its
 * note on why this is never used to calculate a UC or CSU GPA (that needs
 * course-level A-G data, out of scope here; see UcGpaCalculator for the one
 * place a real UC GPA is calculated, from direct semester/honors input).
 */
export default function GpaByYearForm({
  profile,
  onYearChange,
}: {
  profile: StudentProfile;
  onYearChange: (grade: Grade, entry: YearGpa) => void;
}) {
  const years = gpaYearsFor(profile.grade);

  if (years.length === 0) {
    return <p className="text-xs text-slate-500">Pick your current grade above to enter GPA by year.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Weighted GPA is optional and always shown as school-reported — schools calculate it their own way, so
        it&apos;s never recalculated here. Only your unweighted GPA is used for year-over-year trend and for
        comparing you to schools that report an unweighted range.
      </p>
      {years.map((grade) => (
        <YearRow
          key={grade}
          grade={grade}
          entry={profile.yearGpas[grade] ?? { unweighted: null, weighted: null }}
          inProgress={grade === profile.grade}
          onChange={(entry) => onYearChange(grade, entry)}
        />
      ))}
    </div>
  );
}
