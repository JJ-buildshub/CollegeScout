"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Check, HelpCircle, Rocket, Shield, Target } from "lucide-react";
import { colleges, displayedAdmitRate, getCollegeById } from "@/lib/colleges";
import { evaluateCollegeFit, personalizeForAudience, validSatScore } from "@/lib/gpa";
import { US_STATES, stateName } from "@/lib/states";
import type { FitCategory, FitResult, Grade } from "@/lib/types";
import { computeGpaSummary, MAX_INTERESTS, setUcCappedGpaSelfReported, setYearGpa as persistYearGpa, updateProfile, useProfile } from "@/lib/profile";
import { listEntries, useCollegeList } from "@/lib/collegeList";
import FitCollegeCard from "@/components/FitCollegeCard";
import InterestPicker from "@/components/InterestPicker";
import GpaByYearForm from "@/components/GpaByYearForm";
import UcCappedGpaField from "@/components/UcCappedGpaField";
import AcademicCalibrator from "@/components/AcademicCalibrator";
import SchoolStatusBadge from "@/components/SchoolStatusBadge";

const GRADES: Grade[] = [9, 10, 11, 12];

function sortByAdmitRateThenName(a: FitResult, b: FitResult): number {
  const diff = displayedAdmitRate(b.college).value - displayedAdmitRate(a.college).value;
  if (diff !== 0) return diff;
  return a.college.name.localeCompare(b.college.name);
}

function distanceFromRange(r: FitResult): number {
  if (r.rangeLow !== null && r.rangeHigh !== null) {
    if (r.studentGpaUsed < r.rangeLow) return r.rangeLow - r.studentGpaUsed;
    if (r.studentGpaUsed > r.rangeHigh) return r.studentGpaUsed - r.rangeHigh;
    return 0;
  }
  if (r.sat) {
    const points = r.sat.score < r.sat.low ? r.sat.low - r.sat.score : r.sat.score > r.sat.high ? r.sat.score - r.sat.high : 0;
    return points * 0.0025;
  }
  return Infinity;
}

function sortByRangeDistanceThenName(a: FitResult, b: FitResult): number {
  const diff = distanceFromRange(a) - distanceFromRange(b);
  if (diff !== 0) return diff;
  return a.college.name.localeCompare(b.college.name);
}

const GROUP_ORDER: FitCategory[] = ["Safety", "Target", "Reach", "Unrated"];

// Display labels only — the underlying FitCategory values ("Safety"/"Target"/
// "Reach"/"Unrated") stay as-is since lib/gpa.ts's classification logic keys
// off them.
const BUCKET_META: Record<FitCategory, { label: string; icon: typeof Shield; description: string; accent: string }> = {
  Safety: {
    label: "Likely for You",
    icon: Shield,
    description: "Schools where your GPA (and SAT score, if you entered one) is at or above the middle of the typical admitted range, at a broad enough admit rate that admission would be unlikely to surprise you.",
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
    label: "Not enough data to estimate",
    icon: HelpCircle,
    description: "Schools that don't publish a GPA range and don't have a usable admit-rate estimate either.",
    accent: "border-slate-200 bg-slate-50/50",
  },
};

function MatcherContent() {
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { state: collegeListState } = useCollegeList();

  const scrollTarget = searchParams.get("college");
  useEffect(() => {
    if (!scrollTarget) return;
    const el = document.getElementById(`fit-${scrollTarget}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-gold-500");
      setTimeout(() => el.classList.remove("ring-2", "ring-gold-500"), 2500);
    }
  }, [scrollTarget]);

  const gpaSummary = useMemo(() => computeGpaSummary(profile), [profile]);
  const hasUsableGpa = gpaSummary.cumulativeUnweighted !== null;

  // Non-UC schools only: compared against unweighted GPA, same as always.
  const unweightedGpa = gpaSummary.cumulativeUnweighted ?? 0;

  const interestFieldIds = profile.undecided ? [] : profile.interests.map((i) => i.fieldId);

  // A temporary "compare as another state" scenario always wins over the saved home state
  // when set — see the Step 2 control below and lib/profile.ts's note on residencyScenario.
  const effectiveHomeState = profile.residencyScenario ?? profile.homeState;

  const fitResults = useMemo(() => {
    if (!hasUsableGpa) return [];
    const results: FitResult[] = [];
    for (const college of colleges) {
      // UC schools ignore unweightedGpa and satScore entirely (see evaluateUcFit in
      // lib/gpa.ts) — only ucCappedGpaSelfReported (or null, for a Limited-data estimate)
      // ever affects a UC result.
      const fit = evaluateCollegeFit(
        college,
        profile.ucCappedGpaSelfReported,
        unweightedGpa,
        undefined,
        effectiveHomeState,
        profile.satScore ?? undefined
      );
      if (fit) results.push(fit);
    }
    return results;
  }, [hasUsableGpa, unweightedGpa, effectiveHomeState, profile.satScore, profile.ucCappedGpaSelfReported]);

  const fitById = useMemo(() => new Map(fitResults.map((r) => [r.college.id, r])), [fitResults]);

  const savedEntries = listEntries(collegeListState).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const residencyStatusText = profile.residencyScenario
    ? `Comparing as if you lived in ${stateName(profile.residencyScenario) ?? profile.residencyScenario} — a temporary scenario. Your saved home state (${
        profile.homeState ? stateName(profile.homeState) ?? profile.homeState : "not set"
      }) is unchanged.`
    : profile.homeState
      ? `Using your ${stateName(profile.homeState) ?? profile.homeState} residency — in-state rates for ${
          stateName(profile.homeState) ?? profile.homeState
        } schools, out-of-state elsewhere.`
      : "Showing overall admit rates for every school.";

  const buckets: Record<FitCategory, FitResult[]> = {
    Safety: fitResults.filter((r) => r.category === "Safety").sort(sortByRangeDistanceThenName),
    Target: fitResults.filter((r) => r.category === "Target").sort(sortByRangeDistanceThenName),
    Reach: fitResults.filter((r) => r.category === "Reach").sort(sortByRangeDistanceThenName),
    Unrated: fitResults.filter((r) => r.category === "Unrated").sort(sortByAdmitRateThenName),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">My Fit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your profile drives every fit estimate below, and updates the moment you change it — on this
          page or from a school&apos;s own profile.
        </p>
      </div>

      {/* Step 1 & 2: who / state — unchanged from before */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500">Step 1 &middot; Who are you planning for?</span>
          <div className="flex gap-2">
            {(["self", "student"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => updateProfile({ planningFor: choice })}
                aria-pressed={profile.planningFor === choice}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  profile.planningFor === choice ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {profile.planningFor === choice && <Check className="h-3 w-3" strokeWidth={3} />}
                {choice === "self" ? "Myself" : "My student"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500">Step 2 &middot; What state do you live in?</span>
          <select
            value={profile.homeState ?? ""}
            onChange={(e) => updateProfile({ homeState: e.target.value || null })}
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
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500">
            Compare as another state <span className="font-normal text-slate-400">(optional scenario)</span>
          </span>
          <select
            value={profile.residencyScenario ?? ""}
            onChange={(e) => updateProfile({ residencyScenario: e.target.value || null })}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">Use my saved home state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          {profile.residencyScenario && (
            <button
              type="button"
              onClick={() => updateProfile({ residencyScenario: null })}
              className="text-xs font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
            >
              Clear scenario
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          This doesn&apos;t change your saved home state above — it&apos;s a temporary comparison that stays
          set (even after you leave this page) until you clear it or pick a different one.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500">Step 3 &middot; Current grade</span>
          <div className="flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateProfile({ grade: g })}
                aria-pressed={profile.grade === g}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  profile.grade === g ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {profile.grade === g && <Check className="h-3 w-3" strokeWidth={3} />}
                Grade {g}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500">
            Step 4 &middot; Fields of interest (up to {MAX_INTERESTS})
          </span>
          <div className="mt-2">
            <InterestPicker
              interests={profile.interests}
              undecided={profile.undecided}
              onChange={({ interests, undecided }) => updateProfile({ interests, undecided })}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-navy-900">GPA by year</h2>
            <p className="mt-1 text-xs text-slate-500">Only completed years plus your current grade are shown.</p>
            <div className="mt-3">
              <GpaByYearForm profile={profile} onYearChange={(grade, entry) => persistYearGpa(grade, entry)} />
            </div>
            {hasUsableGpa && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Cumulative unweighted GPA:{" "}
                <span className="font-bold text-navy-900">{gpaSummary.cumulativeUnweighted?.toFixed(2)}</span>{" "}
                (average across {gpaSummary.yearsEntered} year{gpaSummary.yearsEntered === 1 ? "" : "s"} entered)
              </div>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
              <label className="block">
                <div className="text-sm font-semibold text-navy-900">
                  SAT score <span className="font-normal text-slate-400">(optional)</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">Total from 400 to 1600. Leave blank if not applicable.</p>
                <input
                  type="number"
                  inputMode="numeric"
                  value={profile.satScore ?? ""}
                  min={400}
                  max={1600}
                  step={10}
                  placeholder="e.g. 1250"
                  onChange={(e) => updateProfile({ satScore: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
                />
              </label>
              {profile.satScore !== null && !validSatScore(profile.satScore) && (
                <p className="mt-1.5 text-xs font-semibold text-rose-600">Enter a score from 400 to 1600. Until then it isn&apos;t used.</p>
              )}
            </div>
          </div>

          <UcCappedGpaField
            value={profile.ucCappedGpaSelfReported}
            onChange={(v) => setUcCappedGpaSelfReported(v)}
          />

          <AcademicCalibrator />
        </div>

        <div className="space-y-8">
          {savedEntries.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-navy-900">Your Schools</h2>
              <p className="mt-1 text-xs text-slate-500">Every school you&apos;ve saved or applied to, shown first.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {savedEntries.map((entry) => {
                  const fit = fitById.get(entry.collegeId);
                  const college = getCollegeById(entry.collegeId);
                  if (fit) {
                    return (
                      <FitCollegeCard
                        key={entry.collegeId}
                        id={`fit-${entry.collegeId}`}
                        result={fit}
                        planningFor={profile.planningFor}
                        interestFieldIds={interestFieldIds}
                      />
                    );
                  }
                  if (!college) return null;
                  return (
                    <div key={entry.collegeId} id={`fit-${entry.collegeId}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                      <h3 className="text-sm font-extrabold text-navy-900">{college.name}</h3>
                      <p className="text-xs text-slate-400">{college.location}</p>
                      <div className="mt-3">
                        <SchoolStatusBadge status={entry.status} round={entry.round} />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">Complete your profile below to see your fit here.</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!hasUsableGpa ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400">
              Pick your current grade and enter at least one year of unweighted GPA to see Reach/Target/Likely
              estimates for every school.
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-navy-900">
                {buckets.Safety.length} likely &middot; {buckets.Target.length} target &middot; {buckets.Reach.length} reach for you
                {buckets.Unrated.length > 0 && ` · ${buckets.Unrated.length} not enough data`}
              </p>

              <p className="text-xs text-slate-400">{residencyStatusText}</p>

              {GROUP_ORDER.map((category) => {
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
                    <p className="mt-1 text-xs text-slate-500">{personalizeForAudience(description, profile.planningFor)}</p>

                    {results.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {results.map((r) => (
                          <FitCollegeCard
                            key={r.college.id}
                            id={`fit-${r.college.id}`}
                            result={r}
                            planningFor={profile.planningFor}
                            interestFieldIds={interestFieldIds}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 py-8 text-center text-xs text-slate-400">
                        No schools land here with your current GPA.
                      </div>
                    )}
                  </section>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatcherPage() {
  return (
    <Suspense fallback={null}>
      <MatcherContent />
    </Suspense>
  );
}
