import type { AdmitRateLean, College, FitResult, ResidencyContext } from "./types";

export const MAX_CAPPED_HONORS_SEMESTERS = 8;

export interface GpaInputs {
  unweightedGpa: number;
  totalSemesters: number;
  honorsSemesters: number;
}

export interface UcGpaResult {
  unweightedGpa: number;
  cappedHonorsSemesters: number;
  bonusPoints: number;
  ucCappedGpa: number;
}

/**
 * UC's official capped-weighted GPA formula: bonus points from honors/AP/IB
 * coursework are capped at 8 semesters (4 year-long courses) across 10th-11th
 * grade, then averaged across the student's total semester count and added
 * to the unweighted GPA.
 */
export function calculateUcCappedGpa({
  unweightedGpa,
  totalSemesters,
  honorsSemesters,
}: GpaInputs): UcGpaResult {
  const safeTotalSemesters = Math.max(totalSemesters, 1);
  const cappedHonorsSemesters = Math.min(
    Math.max(honorsSemesters, 0),
    MAX_CAPPED_HONORS_SEMESTERS
  );
  const bonusPoints = cappedHonorsSemesters / safeTotalSemesters;
  const ucCappedGpa = unweightedGpa + bonusPoints;

  return {
    unweightedGpa,
    cappedHonorsSemesters,
    bonusPoints,
    ucCappedGpa,
  };
}

export type PlanningFor = "self" | "student";

/**
 * Swaps "your GPA" language for "your student's GPA" when a parent/guardian
 * is planning for someone else. Kept as a lightweight text substitution
 * (rather than threading an audience parameter through every reason string)
 * since it only ever needs to adjust this one phrase.
 */
export function personalizeForAudience(text: string, planningFor: PlanningFor): string {
  if (planningFor !== "student") return text;
  return text.replace(/Your GPA/g, "Your student's GPA").replace(/your GPA/g, "your student's GPA");
}

export function parseGpaRange(range: string): { low: number; high: number } | null {
  // Anchored to the start of the (trimmed) string so free-text fields that merely
  // *mention* a dash-separated pair of numbers (e.g. an unrelated enrolled-student
  // distribution note) aren't mistaken for an official mid-50% admitted range.
  const match = range.trim().match(/^(\d+\.\d+)\s*-\s*(\d+\.\d+)\b/);
  if (!match) return null;
  return { low: parseFloat(match[1]), high: parseFloat(match[2]) };
}

// CSU uses its own GPA calculation, not UC's — and we don't have a verified
// CSU-specific formula in this codebase. Rather than build a guessed one,
// CSU falls back to the same treatment as Private/Out-of-State Public:
// compare the student's unweighted GPA against the school's unweighted range.
function usesUcCappedMetric(college: College): boolean {
  return college.system === "UC";
}

/**
 * True only when the school reports a *meaningfully different* in-state vs.
 * out-of-state admit rate — not just that both fields happen to be filled
 * in. A school with identical in-state/out-of-state figures has no real
 * residency signal to preserve, so it's treated the same as a school
 * missing the split entirely.
 */
export function hasResidencySplit(college: College): boolean {
  return (
    college.inStateAdmitRate != null &&
    college.outOfStateAdmitRate != null &&
    college.inStateAdmitRate !== college.outOfStateAdmitRate
  );
}

/**
 * True only for a residency split that's both real (see hasResidencySplit)
 * and passed a consistency check against College Scorecard: 6 of the 39
 * real splits had a Scorecard overall rate landing outside the curated
 * [min(in,out), max(in,out)] range by more than ~3 points (all California
 * public schools — 4 UC, 2 CSU; worst case UC Santa Cruz, 12.8 points),
 * meaning the curated split itself is implausible, not just imprecise. Those
 * 6 are flagged `admitRateSplitSuperseded` (set once, via a one-off check —
 * see the "consistency check for the 39 split schools" commit) rather than
 * re-checked live, matching how `admitRateOverallSuperseded` is a stored
 * marker rather than a per-render computation. The curated values are left
 * in `inStateAdmitRate`/`outOfStateAdmitRate` for history; this is the one
 * gate that decides whether they're still trusted for classification and
 * display.
 */
export function hasReliableResidencySplit(college: College): boolean {
  return hasResidencySplit(college) && !college.admitRateSplitSuperseded;
}

/**
 * Picks which admit rate to classify against.
 *
 * Schools with a real, Scorecard-consistent residency split (33 of 125 —
 * 39 real splits confirmed in ROUND_NUMBER_AUDIT.md, minus 6 that failed
 * the consistency check in hasReliableResidencySplit) keep the curated,
 * residency-aware figures: a full switch to College Scorecard's single
 * blended rate was considered and rejected, since Scorecard has no
 * residency breakdown at all and the gap between in-state and out-of-state
 * can be enormous (UNC Chapel Hill 38.0% vs. 6.6%) — collapsing that to one
 * number would misrepresent an out-of-state applicant's actual odds far
 * worse than a stale figure does. `residency`, when explicitly chosen by
 * the student, always wins (a same-session override); otherwise a known
 * home state derives in-state/out-of-state per school by comparing to
 * `college.state`, since a California student is in-state for a UC campus
 * and out-of-state for UT Austin at the same time — a single global choice
 * could never represent that correctly.
 *
 * Schools with no real split, or one that failed the consistency check
 * (92 of 125) have nothing reliable for residency to preserve, so they use
 * College Scorecard's verified, dated overall rate in place of the curated
 * (often round-number, unverified) one — the more trustworthy figure wins
 * when there's no trustworthy residency information to lose by switching.
 * Falls back to the curated overall rate only if a school somehow has no
 * Scorecard match at all (none currently do).
 */
function resolveAdmitRate(
  college: College,
  residency?: "in-state" | "out-of-state",
  homeState?: string | null
): { rate: number; context: ResidencyContext } {
  if (hasReliableResidencySplit(college)) {
    const effectiveResidency =
      residency ?? (homeState ? (college.state === homeState ? "in-state" : "out-of-state") : undefined);
    if (effectiveResidency === "in-state" && college.inStateAdmitRate != null) {
      return { rate: college.inStateAdmitRate, context: "in-state" };
    }
    if (effectiveResidency === "out-of-state" && college.outOfStateAdmitRate != null) {
      return { rate: college.outOfStateAdmitRate, context: "out-of-state" };
    }
    return { rate: college.admitRateOverall, context: "overall" };
  }
  const scorecardRate = college.scorecard?.admitRateOverall?.value;
  return { rate: scorecardRate ?? college.admitRateOverall, context: "overall" };
}

/**
 * Classifies a school as Safety / Target / Reach using the student's GPA
 * position relative to the school's published middle-50% GPA band, combined
 * with the school's overall admit rate to account for holistic/lottery-style
 * admissions at highly selective schools.
 */
export function classifyFit(
  studentGpa: number,
  rangeLow: number,
  rangeHigh: number,
  admitRateOverall: number
): { category: AdmitRateLean; reason: string } {
  // Sub-10% admit schools are lottery-like: never a true safety.
  if (admitRateOverall < 0.1) {
    if (studentGpa > rangeHigh) {
      return {
        category: "Reach",
        reason:
          "Your GPA is above the mid-50% range, but this school's sub-10% admit rate makes it a Reach for everyone.",
      };
    }
    return {
      category: "Reach",
      reason: "This school's extremely low admit rate makes it a Reach regardless of GPA.",
    };
  }

  const band = studentGpa < rangeLow ? "below" : studentGpa > rangeHigh ? "above" : "within";

  if (band === "below") {
    return {
      category: "Reach",
      reason: "Your GPA falls below this school's typical mid-50% admitted range.",
    };
  }

  if (band === "within") {
    if (admitRateOverall < 0.25) {
      return {
        category: "Reach",
        reason: "Your GPA is within range, but the admit rate is under 25%, so admission is still competitive.",
      };
    }
    return {
      category: "Target",
      reason: "Your GPA sits within the typical mid-50% admitted range for this school.",
    };
  }

  // band === "above"
  if (admitRateOverall < 0.25) {
    return {
      category: "Target",
      reason: "Your GPA is above the typical range, but low overall admit rate keeps this a Target for you, not Likely for you.",
    };
  }
  if (admitRateOverall < 0.5) {
    const margin = studentGpa - rangeHigh;
    if (margin > 0.1) {
      return {
        category: "Safety",
        reason: "Your GPA comfortably exceeds the mid-50% range at a moderately selective school.",
      };
    }
    return {
      category: "Target",
      reason: "Your GPA is slightly above range at a moderately selective school.",
    };
  }
  return {
    category: "Safety",
    reason: "Your GPA exceeds the typical admitted range at a school with a higher overall admit rate.",
  };
}

/**
 * Fallback for schools that don't publicly report a GPA band (common for many
 * merit-focused and holistic-review schools) — classify from admit rate alone
 * rather than silently dropping the school out of the Safety/Target/Reach view.
 */
function classifyFitByAdmitRateOnly(admitRate: number): { category: AdmitRateLean; reason: string } {
  if (admitRate < 0.1) {
    return { category: "Reach", reason: "its sub-10% admit rate alone makes it a Reach for nearly everyone" };
  }
  if (admitRate < 0.4) {
    return { category: "Target", reason: "it would lean Target for you based on admit rate alone" };
  }
  return { category: "Safety", reason: "its broad admit rate alone would lean Likely for you" };
}

/**
 * Classifies a school as Safety / Target / Reach / Unrated.
 *
 * "Unrated" is returned whenever the school doesn't publish a GPA band for the
 * relevant metric — a school is never silently placed into a real Safety/
 * Target/Reach bucket from admit rate alone, since that conflates "no data"
 * with "we compared your GPA and it's fine." The admit-rate-only lean is
 * still surfaced (via `admitRateOnlyLean`) as a clearly-labeled rough signal.
 *
 * `residency`, when supplied, is a manual override that always wins. Absent
 * that, `homeState` (a plain state code, not a residency flag — see
 * `resolveAdmitRate`) derives the right in-state/out-of-state rate per
 * school automatically. Either can be omitted; both default to the overall
 * rate.
 */
export function evaluateCollegeFit(
  college: College,
  ucCappedGpa: number,
  unweightedGpa: number,
  residency?: "in-state" | "out-of-state",
  homeState?: string | null
): FitResult | null {
  const useUcCapped = usesUcCappedMetric(college);
  const rangeStr = useUcCapped ? college.mid50_GPA_UCCapped : college.mid50_GPA_Unweighted;
  const parsed = parseGpaRange(rangeStr);
  const studentGpaUsed = useUcCapped ? ucCappedGpa : unweightedGpa;
  const { rate: admitRate, context: residencyContext } = resolveAdmitRate(college, residency, homeState);

  if (!parsed) {
    const { category: lean, reason: leanReason } = classifyFitByAdmitRateOnly(admitRate);
    const residencyNote =
      residencyContext !== "overall"
        ? ` Using the ${residencyContext} admit rate (${Math.round(admitRate * 100)}%) instead of the overall rate (${Math.round(college.admitRateOverall * 100)}%).`
        : "";
    return {
      college,
      category: "Unrated",
      studentGpaUsed,
      gpaMetricLabel: "GPA band not reported",
      rangeLow: null,
      rangeHigh: null,
      reason:
        `This school doesn't publish a GPA range, so we can't compare your GPA to it directly. Based on ${leanReason} — but treat that as a rough signal, not a personalized estimate.${residencyNote}`,
      admitRateOnlyLean: lean,
      residencyContext,
    };
  }

  const { category, reason } = classifyFit(studentGpaUsed, parsed.low, parsed.high, admitRate);

  return {
    college,
    category,
    studentGpaUsed,
    gpaMetricLabel: useUcCapped ? "UC Capped GPA" : "Unweighted GPA",
    rangeLow: parsed.low,
    rangeHigh: parsed.high,
    reason,
    admitRateOnlyLean: null,
    residencyContext,
  };
}
