"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  calculateUcCappedGpa,
  calculateUcNonResidentGpa,
  ucMinimumStatus,
  UC_MAX_10TH_GRADE_HONORS,
} from "@/lib/gpa";
import type { UcGpaCalculatorInputs } from "@/lib/profile";

const DEFAULT_INPUTS: UcGpaCalculatorInputs = { totalSemesters: 20, honorsSemesters: 0 };

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-navy-900">{label}</div>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
      />
    </label>
  );
}

function OptionalCountField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        {label} <span className="font-normal text-slate-400">(optional)</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
      />
    </label>
  );
}

/**
 * UC's real GPA formula, from direct semester/honors counts — never derived
 * from the yearly unweighted/weighted GPA trend (see the note on
 * UcGpaCalculatorInputs in lib/profile.ts). `cumulativeUnweighted` (the
 * trend's plain average) supplies the unweighted half of UC's formula; this
 * calculator supplies the honors-bonus half directly. Until the student fills
 * this in, UC schools are compared using unweighted GPA alone (zero honors
 * bonus assumed) — an undercount, never a guess.
 */
export default function UcGpaCalculator({
  cumulativeUnweighted,
  inputs,
  onChange,
  homeState,
}: {
  cumulativeUnweighted: number | null;
  inputs: UcGpaCalculatorInputs | null;
  onChange: (inputs: UcGpaCalculatorInputs) => void;
  homeState: string | null;
}) {
  const [open, setOpen] = useState(false);
  const effective = inputs ?? DEFAULT_INPUTS;
  const unweightedGpa = cumulativeUnweighted ?? 0;
  const gpaResult = calculateUcCappedGpa({ ...effective, unweightedGpa });

  if (cumulativeUnweighted === null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-400">
        Enter at least one year of unweighted GPA above to unlock the UC GPA calculator.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-sm font-bold text-navy-900">Applying to a UC? Calculate your UC-capped GPA.</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Based on the official UC formula: your unweighted GPA above, plus honors/AP/IB bonus points
            (at most 8 semesters, at most 4 from 10th grade) from 10th and 11th grade only. UC calculates your
            official GPA from actual course grades when you apply — this needs course-level data we don&apos;t
            collect, so treat this as a close estimate, not the official number.
          </p>
          <NumberField
            label="Total A-G semesters completed (10th & 11th grade)"
            hint="e.g. 5 classes/year x 2 years x 2 semesters = 20."
            value={effective.totalSemesters}
            min={1}
            max={40}
            onChange={(v) => onChange({ ...effective, totalSemesters: v })}
          />
          <NumberField
            label="Honors / AP / IB semesters completed (10th & 11th grade)"
            hint="Capped at 8 semesters for UC GPA purposes, even if you've taken more."
            value={effective.honorsSemesters}
            min={0}
            max={40}
            onChange={(v) => onChange({ ...effective, honorsSemesters: v })}
          />
          <OptionalCountField
            label="How many of those were in 10th grade?"
            hint={`UC counts at most ${UC_MAX_10TH_GRADE_HONORS} honors points from 10th grade. Leave blank and we won't apply that limit.`}
            value={effective.honors10Semesters}
            onChange={(v) => onChange({ ...effective, honors10Semesters: v })}
          />
          {homeState !== null && homeState !== "CA" && (
            <OptionalCountField
              label="How many were school-designated honors (not AP or IB)?"
              hint="For the 3.4 minimum for out-of-state applicants, UC gives extra weight to AP and IB courses only."
              value={effective.schoolHonorsSemesters}
              onChange={(v) => onChange({ ...effective, schoolHonorsSemesters: v })}
            />
          )}

          <div className="rounded-xl bg-navy-900 p-4 text-white">
            <div className="text-xs font-semibold tracking-wide text-slate-300">Your UC-Capped Weighted GPA</div>
            <div className="mt-1 text-3xl font-extrabold text-gold-400">{gpaResult.ucCappedGpa.toFixed(2)}</div>
            <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs leading-snug text-slate-200">
              {homeState === "CA" || homeState === null ? (
                <p>{ucMinimumStatus(gpaResult.ucCappedGpa, true)}</p>
              ) : (
                <p>
                  {ucMinimumStatus(calculateUcNonResidentGpa({ ...effective, unweightedGpa }).ucCappedGpa, false)} (AP/IB-only GPA:{" "}
                  {calculateUcNonResidentGpa({ ...effective, unweightedGpa }).ucCappedGpa.toFixed(2)}.)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!open && !inputs && (
        <p className="mt-2 text-xs text-slate-400">
          Not filled in yet — UC schools are currently compared using your unweighted GPA alone (assumes no
          Honors/AP/IB courses).
        </p>
      )}
    </div>
  );
}
