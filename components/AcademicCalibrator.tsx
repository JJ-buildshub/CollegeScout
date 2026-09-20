"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { MAX_CAPPED_HONORS_SEMESTERS } from "@/lib/gpa";

const ASSUMED_TOTAL_SEMESTERS = 20;
const SCALE_MAX = 4.6;

export default function AcademicCalibrator() {
  const [unweightedGpa, setUnweightedGpa] = useState(3.7);
  const [honorsSemesters, setHonorsSemesters] = useState(4);

  const bonus = Math.min(honorsSemesters, MAX_CAPPED_HONORS_SEMESTERS) / ASSUMED_TOTAL_SEMESTERS;
  const capped = unweightedGpa + bonus;
  const pct = (v: number) => `${Math.min(100, (v / SCALE_MAX) * 100)}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-bold text-navy-900">Academic Calibrator</h2>
      <p className="mt-1 text-xs text-slate-500">
        Illustrative only (assumes a {ASSUMED_TOTAL_SEMESTERS}-semester course load) — slide to see how
        AP/Honors coursework separates your UC-capped weighted GPA from your raw unweighted GPA.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Unweighted GPA</span>
            <span>{unweightedGpa.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={2}
            max={4}
            step={0.05}
            value={unweightedGpa}
            onChange={(e) => setUnweightedGpa(parseFloat(e.target.value))}
            className="mt-2 w-full accent-navy-900"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Honors / AP / IB semesters (10th &amp; 11th)</span>
            <span>{honorsSemesters} / {MAX_CAPPED_HONORS_SEMESTERS} max</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_CAPPED_HONORS_SEMESTERS}
            step={1}
            value={honorsSemesters}
            onChange={(e) => setHonorsSemesters(parseInt(e.target.value, 10))}
            className="mt-2 w-full accent-gold-500"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <BarRow label="Unweighted GPA" value={unweightedGpa} pct={pct(unweightedGpa)} color="bg-slate-400" />
        <BarRow label="UC-Capped Weighted GPA" value={capped} pct={pct(capped)} color="bg-gold-500" />
      </div>

      <div className="mt-5 flex gap-2 rounded-xl bg-navy-900/5 p-4 text-xs leading-relaxed text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-900" />
        <p>
          <span className="font-bold text-navy-900">Reality Check: </span>
          High schools don&apos;t all offer the same number of AP, Honors, or IB courses, so the same
          capped GPA can reflect very different amounts of available rigor.
        </p>
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span className="font-bold text-navy-900">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color} transition-all duration-200`} style={{ width: pct }} />
      </div>
    </div>
  );
}
