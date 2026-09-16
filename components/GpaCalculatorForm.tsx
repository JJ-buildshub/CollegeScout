"use client";

import { Info } from "lucide-react";
import type { GpaInputs } from "@/lib/gpa";

interface Props {
  inputs: GpaInputs;
  onChange: (inputs: GpaInputs) => void;
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

export default function GpaCalculatorForm({ inputs, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-bold text-navy-900">UC Capped GPA Calculator</h2>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Based on the official UC formula: honors/AP/IB bonus points are capped at 8 semesters (4
        year-long courses) across 10th &amp; 11th grade only.
      </p>

      <div className="mt-5 space-y-5">
        <NumberField
          label="Unweighted GPA (10th & 11th grade, A-G courses)"
          hint="On a standard 4.0 scale."
          value={inputs.unweightedGpa}
          min={0}
          max={4}
          step={0.01}
          onChange={(v) => onChange({ ...inputs, unweightedGpa: v })}
        />
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
      </div>
    </div>
  );
}
