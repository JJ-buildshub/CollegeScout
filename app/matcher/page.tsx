"use client";

import { useEffect, useMemo, useState } from "react";
import { Rocket, Shield, Target } from "lucide-react";
import { colleges } from "@/lib/colleges";
import { calculateUcCappedGpa, evaluateCollegeFit, type GpaInputs } from "@/lib/gpa";
import type { FitCategory, FitResult } from "@/lib/types";
import GpaCalculatorForm from "@/components/GpaCalculatorForm";
import FitCollegeCard from "@/components/FitCollegeCard";
import AcademicCalibrator from "@/components/AcademicCalibrator";

const STORAGE_KEY = "pathfinder-admit:gpa-inputs";

const DEFAULT_INPUTS: GpaInputs = {
  unweightedGpa: 3.7,
  totalSemesters: 20,
  honorsSemesters: 6,
};

const BUCKET_META: Record<FitCategory, { icon: typeof Shield; description: string; accent: string }> = {
  Safety: {
    icon: Shield,
    description: "Your GPA comfortably exceeds the typical admitted range.",
    accent: "border-emerald-200 bg-emerald-50/50",
  },
  Target: {
    icon: Target,
    description: "Your GPA is competitive and within the typical admitted range.",
    accent: "border-amber-200 bg-amber-50/50",
  },
  Reach: {
    icon: Rocket,
    description: "Below typical range, or highly selective regardless of GPA.",
    accent: "border-rose-200 bg-rose-50/50",
  },
};

export default function MatcherPage() {
  const [inputs, setInputs] = useState<GpaInputs>(DEFAULT_INPUTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInputs(JSON.parse(saved));
    } catch {
      // ignore malformed/unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // ignore unavailable storage
    }
  }, [inputs, loaded]);

  const gpaResult = useMemo(() => calculateUcCappedGpa(inputs), [inputs]);

  const fitResults = useMemo(() => {
    const results: FitResult[] = [];
    for (const college of colleges) {
      const fit = evaluateCollegeFit(college, gpaResult.ucCappedGpa, inputs.unweightedGpa);
      if (fit) results.push(fit);
    }
    return results;
  }, [gpaResult, inputs.unweightedGpa]);

  const buckets: Record<FitCategory, FitResult[]> = {
    Safety: fitResults.filter((r) => r.category === "Safety").sort((a, b) => a.college.rank - b.college.rank),
    Target: fitResults.filter((r) => r.category === "Target").sort((a, b) => a.college.rank - b.college.rank),
    Reach: fitResults.filter((r) => r.category === "Reach").sort((a, b) => a.college.rank - b.college.rank),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Admissions Matcher &amp; Academic Profiler
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare admissions selectivity and calculate your weighted profile. Includes specialized
          tools for California (UC/CSU Capped GPA) alongside national benchmark metrics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GpaCalculatorForm inputs={inputs} onChange={setInputs} />

          <div className="rounded-2xl bg-navy-900 p-6 text-white shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Your UC Capped Weighted GPA
            </div>
            <div className="mt-1 text-4xl font-extrabold text-gold-400">
              {gpaResult.ucCappedGpa.toFixed(2)}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Unweighted GPA</span>
                <span className="font-semibold text-white">{inputs.unweightedGpa.toFixed(2)}</span>
              </div>
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
            <p className="mt-4 text-xs text-slate-400">
              Private &amp; out-of-state schools are compared against your unweighted GPA, since they
              don&apos;t report a UC-capped figure.
            </p>
          </div>

          <AcademicCalibrator />
        </div>

        <div className="space-y-8">
          {(["Reach", "Target", "Safety"] as FitCategory[]).map((category) => {
            const { icon: Icon, description, accent } = BUCKET_META[category];
            const results = buckets[category];
            return (
              <section key={category} className={`rounded-2xl border p-5 ${accent}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-navy-900" />
                  <h2 className="text-lg font-bold text-navy-900">{category}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-navy-900 shadow-card">
                    {results.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{description}</p>

                {results.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((r) => (
                      <FitCollegeCard key={r.college.id} result={r} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 py-8 text-center text-xs text-slate-400">
                    No schools land here with your current GPA inputs.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
