"use client";

import { ChevronDown, Info } from "lucide-react";
import { validSatScore, type GpaInputs, type UcGpaResult } from "@/lib/gpa";

interface Props {
  inputs: GpaInputs;
  onChange: (inputs: GpaInputs) => void;
  gpaResult: UcGpaResult;
  ucSectionOpen: boolean;
  onToggleUcSection: () => void;
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">{label}</div>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
      />
    </label>
  );
}

export default function GpaCalculatorForm({
  inputs,
  onChange,
  gpaResult,
  ucSectionOpen,
  onToggleUcSection,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-bold text-navy-900">Your GPA and test score</h2>
      <p className="mt-1 text-xs text-slate-500">
        Your unweighted GPA is what most schools compare you against. An SAT score is optional.
      </p>

      <div className="mt-5">
        <NumberField
          label="Unweighted GPA"
          hint="On a standard 4.0 scale."
          value={inputs.unweightedGpa}
          min={0}
          max={4}
          step={0.01}
          onChange={(v) => onChange({ ...inputs, unweightedGpa: v })}
        />
      </div>

      <div className="mt-5">
        <label className="block">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            SAT score <span className="font-normal text-slate-400">(optional)</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Total from 400 to 1600. Leave blank if you haven&apos;t taken it or don&apos;t plan to send it. It&apos;s
            only used where a school publishes an SAT range and looks at scores.
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={inputs.satScore ?? ""}
            min={400}
            max={1600}
            step={10}
            placeholder="e.g. 1250"
            onChange={(e) =>
              onChange({
                ...inputs,
                satScore: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
          />
        </label>
        {inputs.satScore !== undefined && !validSatScore(inputs.satScore) && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            Enter a score from 400 to 1600. Until then it isn&apos;t used.
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onToggleUcSection}
          aria-expanded={ucSectionOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-semibold text-navy-900">
            Applying to a UC? Calculate your UC GPA.
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${ucSectionOpen ? "rotate-180" : ""}`}
          />
        </button>

        {ucSectionOpen && (
          <div className="mt-4 space-y-5">
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Based on the official UC formula: only 10th and 11th grade count toward this GPA —
              9th and 12th grade aren&apos;t included — and honors/AP/IB bonus points are capped
              at 8 semesters (4 year-long courses) within that window.
            </p>
            <NumberField
              label="Total A-G semesters completed (10th & 11th grade)"
              hint="e.g. 5 classes/year x 2 years x 2 semesters = 20."
              value={inputs.totalSemesters}
              min={1}
              max={40}
              step={1}
              onChange={(v) => onChange({ ...inputs, totalSemesters: v })}
            />
            <NumberField
              label="Honors / AP / IB semesters completed (10th & 11th grade)"
              hint="Capped at 8 semesters for UC GPA purposes, even if you've taken more."
              value={inputs.honorsSemesters}
              min={0}
              max={40}
              step={1}
              onChange={(v) => onChange({ ...inputs, honorsSemesters: v })}
            />

            <div className="rounded-xl bg-navy-900 p-4 text-white">
              <div className="text-xs font-semibold tracking-wide text-slate-300">
                Your UC Capped Weighted GPA
              </div>
              <div className="mt-1 text-3xl font-extrabold text-gold-400">
                {gpaResult.ucCappedGpa.toFixed(2)}
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Honors/AP/IB semesters counted</span>
                  <span className="font-semibold text-white">
                    {gpaResult.cappedHonorsSemesters} / 8 max
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus points added</span>
                  <span className="font-semibold text-white">+{gpaResult.bonusPoints.toFixed(3)}</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-snug text-slate-400">
                Only UC schools are compared using your UC-capped GPA. CSU, private, and
                out-of-state schools are compared using your unweighted GPA, because that&apos;s
                the number they report.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
