"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Rocket, Shield, Target } from "lucide-react";
import { colleges } from "@/lib/colleges";
import { calculateUcCappedGpa, evaluateCollegeFit, personalizeForAudience, type GpaInputs, type PlanningFor } from "@/lib/gpa";
import { US_STATES, stateName } from "@/lib/states";
import type { FitCategory, FitResult } from "@/lib/types";
import GpaCalculatorForm from "@/components/GpaCalculatorForm";
import FitCollegeCard from "@/components/FitCollegeCard";
import AcademicCalibrator from "@/components/AcademicCalibrator";

const STORAGE_KEY = "pathfinder-admit:gpa-inputs";
const RESIDENCY_STORAGE_KEY = "pathfinder-admit:residency";
const PLANNING_FOR_STORAGE_KEY = "pathfinder-admit:planning-for";
const HOME_STATE_STORAGE_KEY = "pathfinder-admit:home-state";

type ResidencyChoice = "unknown" | "in-state" | "out-of-state";

// Distance from the midpoint of the school's own published GPA range — the
// original sort, kept only for the untouched-defaults view (see
// isUntouchedState below).
function marginFromMidpoint(r: FitResult): number {
  if (r.rangeLow === null || r.rangeHigh === null) return Infinity;
  return Math.abs(r.studentGpaUsed - (r.rangeLow + r.rangeHigh) / 2);
}

function sortByFitThenName(a: FitResult, b: FitResult): number {
  const marginDiff = marginFromMidpoint(a) - marginFromMidpoint(b);
  if (marginDiff !== 0) return marginDiff;
  return a.college.name.localeCompare(b.college.name);
}

// How close the student's GPA is to actually landing in the school's mid-50%
// range: 0 if inside it, otherwise the gap to the nearer edge. Distinct from
// marginFromMidpoint, which keeps penalizing a GPA that's well inside a wide
// range just for being off-center — this treats "comfortably in range" as
// equally close regardless of where in the range it falls.
function distanceFromRange(r: FitResult): number {
  if (r.rangeLow === null || r.rangeHigh === null) return Infinity;
  if (r.studentGpaUsed < r.rangeLow) return r.rangeLow - r.studentGpaUsed;
  if (r.studentGpaUsed > r.rangeHigh) return r.studentGpaUsed - r.rangeHigh;
  return 0;
}

function sortByRangeDistanceThenName(a: FitResult, b: FitResult): number {
  const diff = distanceFromRange(a) - distanceFromRange(b);
  if (diff !== 0) return diff;
  return a.college.name.localeCompare(b.college.name);
}

function sortByName(a: FitResult, b: FitResult): number {
  return a.college.name.localeCompare(b.college.name);
}

// Pre-change behavior, group order and all — shown until the student
// actually changes something, per instruction to leave the default view
// alone rather than reshuffle it before they've entered anything.
const DEFAULT_GROUP_ORDER: FitCategory[] = ["Reach", "Target", "Safety", "Unrated"];
const NEW_GROUP_ORDER: FitCategory[] = ["Safety", "Target", "Reach", "Unrated"];

const DEFAULT_INPUTS: GpaInputs = {
  unweightedGpa: 3.7,
  totalSemesters: 20,
  honorsSemesters: 6,
};

// Display labels only — the underlying FitCategory values ("Safety"/"Target"/
// "Reach"/"Unrated") stay as-is since lib/gpa.ts's classification logic keys
// off them; "Safety" reads as a certainty the data can't support (a 45%-admit
// school isn't a safety for every student), so only what's shown changes.
const BUCKET_META: Record<FitCategory, { label: string; icon: typeof Shield; description: string; accent: string }> = {
  Safety: {
    label: "Likely for You",
    icon: Shield,
    description: "Schools where your GPA clearly exceeds the typical admitted range, at a broad enough admit rate that admission would be unlikely to surprise you.",
    accent: "border-emerald-200 bg-emerald-50/50",
  },
  Target: {
    label: "Target for You",
    icon: Target,
    description: "Schools where your GPA fits the typical admitted range, or where a low admit rate still keeps admission realistically competitive.",
    accent: "border-amber-200 bg-amber-50/50",
  },
  Reach: {
    label: "Reach for You",
    icon: Rocket,
    description: "Schools where your GPA is below range, or where a low admit rate makes admission uncertain regardless of GPA.",
    accent: "border-rose-200 bg-rose-50/50",
  },
  Unrated: {
    label: "Unrated",
    icon: HelpCircle,
    description: "Schools that don't publish a GPA range. We can't directly compare your GPA here — each card shows our best admit-rate-only estimate instead.",
    accent: "border-slate-200 bg-slate-50/50",
  },
};

export default function MatcherPage() {
  const [inputs, setInputs] = useState<GpaInputs>(DEFAULT_INPUTS);
  const [residency, setResidency] = useState<ResidencyChoice>("unknown");
  const [planningFor, setPlanningFor] = useState<PlanningFor>("self");
  const [homeState, setHomeState] = useState<string | null>(null);
  const [showResidencyOverride, setShowResidencyOverride] = useState(false);
  const [ucSectionOpen, setUcSectionOpen] = useState(false);
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
      const savedHomeState = localStorage.getItem(HOME_STATE_STORAGE_KEY);
      if (savedHomeState) {
        setHomeState(savedHomeState);
        setUcSectionOpen(savedHomeState === "CA");
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
      if (homeState) localStorage.setItem(HOME_STATE_STORAGE_KEY, homeState);
      else localStorage.removeItem(HOME_STATE_STORAGE_KEY);
    } catch {
      // ignore unavailable storage
    }
  }, [inputs, residency, planningFor, homeState, loaded]);

  const gpaResult = useMemo(() => calculateUcCappedGpa(inputs), [inputs]);

  const fitResults = useMemo(() => {
    // The manual override always wins when set; otherwise home state derives
    // in-state/out-of-state per school automatically (see resolveAdmitRate in
    // lib/gpa.ts). If neither is set, every school uses its overall rate —
    // identical to today's behavior with nothing configured.
    const residencyArg = residency === "unknown" ? undefined : residency;
    const results: FitResult[] = [];
    for (const college of colleges) {
      const fit = evaluateCollegeFit(college, gpaResult.ucCappedGpa, inputs.unweightedGpa, residencyArg, homeState);
      if (fit) results.push(fit);
    }
    return results;
  }, [gpaResult, inputs.unweightedGpa, residency, homeState]);

  const residencyStatusText =
    residency === "in-state"
      ? "Using your manually-set in-state residency for every school."
      : residency === "out-of-state"
        ? "Using your manually-set out-of-state residency for every school."
        : homeState
          ? `Using your ${stateName(homeState) ?? homeState} residency — in-state rates for ${
              stateName(homeState) ?? homeState
            } schools, out-of-state elsewhere.`
          : "Showing overall admit rates for every school.";

  // True only while every input still sits at its untouched default — the
  // moment the student changes anything (GPA, coursework, residency, home
  // state), the new grouping/sort/summary take over and stay on for the
  // rest of the session.
  const isUntouchedState =
    inputs.unweightedGpa === DEFAULT_INPUTS.unweightedGpa &&
    inputs.totalSemesters === DEFAULT_INPUTS.totalSemesters &&
    inputs.honorsSemesters === DEFAULT_INPUTS.honorsSemesters &&
    residency === "unknown" &&
    !homeState;

  const groupOrder = isUntouchedState ? DEFAULT_GROUP_ORDER : NEW_GROUP_ORDER;
  const ratedSort = isUntouchedState ? sortByFitThenName : sortByRangeDistanceThenName;

  const buckets: Record<FitCategory, FitResult[]> = {
    Safety: fitResults.filter((r) => r.category === "Safety").sort(ratedSort),
    Target: fitResults.filter((r) => r.category === "Target").sort(ratedSort),
    Reach: fitResults.filter((r) => r.category === "Reach").sort(ratedSort),
    Unrated: fitResults.filter((r) => r.category === "Unrated").sort(sortByName),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Find My Fit
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare admissions selectivity and calculate your weighted profile. Includes specialized
          tools for California (UC Capped GPA) alongside national admissions data.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 1 &middot; Who are you planning for?
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
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 2 &middot; What state do you live in?
          </span>
          <select
            value={homeState ?? ""}
            onChange={(e) => {
              // A manual residency override is calibrated to the previous
              // home state (or no state); it must not silently carry over
              // and win against a newly-picked state's derived per-school
              // residency (see resolveAdmitRate in lib/gpa.ts).
              const next = e.target.value || null;
              setHomeState(next);
              setResidency("unknown");
              setShowResidencyOverride(false);
              // Re-derive the UC section's default open/closed state fresh
              // on every pick, rather than only on first load — still
              // freely toggleable afterward, this is just what a new state
              // selection resets to.
              setUcSectionOpen(next === "CA");
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">Skip &mdash; use overall admit rates</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GpaCalculatorForm
            inputs={inputs}
            onChange={setInputs}
            gpaResult={gpaResult}
            ucSectionOpen={ucSectionOpen}
            onToggleUcSection={() => setUcSectionOpen((v) => !v)}
          />

          <AcademicCalibrator />
        </div>

        <div className="space-y-8">
          <p className="text-xs text-slate-400">
            Fit estimates use publicly reported GPA ranges and admit rates. Some are approximate.
          </p>

          {!isUntouchedState && (
            <p className="text-sm font-semibold text-navy-900">
              {buckets.Safety.length} likely &middot; {buckets.Target.length} target &middot;{" "}
              {buckets.Reach.length} reach for you
            </p>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{residencyStatusText}</span>
              <button
                type="button"
                onClick={() => setShowResidencyOverride((v) => !v)}
                className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
              >
                Change
              </button>
            </div>
            {showResidencyOverride && (
              <div className="mt-2 flex max-w-xs gap-2">
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
                    {choice === "unknown" ? "Use default" : choice === "in-state" ? "In-state" : "Out-of-state"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {groupOrder.map((category) => {
            const { label, icon: Icon, description, accent } = BUCKET_META[category];
            const results = buckets[category];
            return (
              <section key={category} className={`rounded-2xl border p-5 ${accent}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-navy-900" />
                  <h2 className="text-lg font-bold text-navy-900">{label}</h2>
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
