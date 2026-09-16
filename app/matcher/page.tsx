"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Rocket, Shield, Target } from "lucide-react";
import { colleges } from "@/lib/colleges";
import { calculateUcCappedGpa, evaluateCollegeFit, personalizeForAudience, type GpaInputs, type PlanningFor } from "@/lib/gpa";
import type { FitCategory, FitResult } from "@/lib/types";
import GpaCalculatorForm from "@/components/GpaCalculatorForm";
import FitCollegeCard from "@/components/FitCollegeCard";
import AcademicCalibrator from "@/components/AcademicCalibrator";

const STORAGE_KEY = "pathfinder-admit:gpa-inputs";
const RESIDENCY_STORAGE_KEY = "pathfinder-admit:residency";
const PLANNING_FOR_STORAGE_KEY = "pathfinder-admit:planning-for";

type ResidencyChoice = "unknown" | "in-state" | "out-of-state";

const DEFAULT_INPUTS: GpaInputs = {
  unweightedGpa: 3.7,
  totalSemesters: 20,
  honorsSemesters: 6,
};

const BUCKET_META: Record<FitCategory, { icon: typeof Shield; description: string; accent: string }> = {
  Safety: {
    icon: Shield,
    description: "Schools where your GPA clearly exceeds the typical admitted range, at a broad enough admit rate that admission would be unlikely to surprise you.",
    accent: "border-emerald-200 bg-emerald-50/50",
  },
  Target: {
    icon: Target,
    description: "Schools where your GPA fits the typical admitted range, or where a low admit rate still keeps admission realistically competitive.",
    accent: "border-amber-200 bg-amber-50/50",
  },
  Reach: {
    icon: Rocket,
    description: "Schools where your GPA is below range, or where a low admit rate makes admission uncertain regardless of GPA.",
    accent: "border-rose-200 bg-rose-50/50",
  },
  Unrated: {
    icon: HelpCircle,
    description: "Schools that don't publish a GPA range. We can't directly compare your GPA here — each card shows our best admit-rate-only estimate instead.",
    accent: "border-slate-200 bg-slate-50/50",
  },
};

export default function MatcherPage() {
  const [inputs, setInputs] = useState<GpaInputs>(DEFAULT_INPUTS);
  const [residency, setResidency] = useState<ResidencyChoice>("unknown");
  const [planningFor, setPlanningFor] = useState<PlanningFor>("self");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInputs(JSON.parse(saved));
      const savedResidency = localStorage.getItem(RESIDENCY_STORAGE_KEY);
      if (savedResidency === "in-state" || savedResidency === "out-of-state") {
        setResidency(savedResidency);
      }
      const savedPlanningFor = localStorage.getItem(PLANNING_FOR_STORAGE_KEY);
      if (savedPlanningFor === "self" || savedPlanningFor === "student") {
        setPlanningFor(savedPlanningFor);
      }
    } catch {
      // ignore malformed/unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
      localStorage.setItem(RESIDENCY_STORAGE_KEY, residency);
      localStorage.setItem(PLANNING_FOR_STORAGE_KEY, planningFor);
    } catch {
      // ignore unavailable storage
    }
  }, [inputs, residency, planningFor, loaded]);

  const gpaResult = useMemo(() => calculateUcCappedGpa(inputs), [inputs]);

  const fitResults = useMemo(() => {
    const residencyArg = residency === "unknown" ? undefined : residency;
    const results: FitResult[] = [];
    for (const college of colleges) {
      const fit = evaluateCollegeFit(college, gpaResult.ucCappedGpa, inputs.unweightedGpa, residencyArg);
      if (fit) results.push(fit);
    }
    return results;
  }, [gpaResult, inputs.unweightedGpa, residency]);

  const buckets: Record<FitCategory, FitResult[]> = {
    Safety: fitResults.filter((r) => r.category === "Safety").sort((a, b) => a.college.rank - b.college.rank),
    Target: fitResults.filter((r) => r.category === "Target").sort((a, b) => a.college.rank - b.college.rank),
    Reach: fitResults.filter((r) => r.category === "Reach").sort((a, b) => a.college.rank - b.college.rank),
    Unrated: fitResults.filter((r) => r.category === "Unrated").sort((a, b) => a.college.rank - b.college.rank),
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

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Who are you planning for?
        </span>
        <div className="flex gap-2">
          {(["self", "student"] as PlanningFor[]).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setPlanningFor(choice)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                planningFor === choice
                  ? "bg-navy-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {choice === "self" ? "Myself" : "My student"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GpaCalculatorForm inputs={inputs} onChange={setInputs} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Residency (optional)
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Some public schools admit in-state and out-of-state applicants at very different
              rates. Tell us yours for a more accurate estimate wherever a school reports it.
            </p>
            <div className="mt-3 flex gap-2">
              {(["unknown", "in-state", "out-of-state"] as ResidencyChoice[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setResidency(choice)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                    residency === choice
                      ? "bg-navy-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {choice === "unknown" ? "Not sure" : choice === "in-state" ? "In-state" : "Out-of-state"}
                </button>
              ))}
            </div>
          </div>

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
          {(["Reach", "Target", "Safety", "Unrated"] as FitCategory[]).map((category) => {
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
                <p className="mt-1 text-xs text-slate-500">
                  {personalizeForAudience(description, planningFor)}
                </p>

                {results.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((r) => (
                      <FitCollegeCard key={r.college.id} result={r} planningFor={planningFor} />
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
