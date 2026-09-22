import type { AdmitRateLean, College, FitResult, ResidencyContext } from "./types";

export const MAX_CAPPED_HONORS_SEMESTERS = 8;

export interface GpaInputs {
  unweightedGpa: number;
  totalSemesters: number;
  honorsSemesters: number;
  /**
   * Optional: how many of the honors semesters were in 10th grade. UC counts at
   * most 4 honors points from 10th grade. Absent means "not said", and the
   * limit isn't applied (the tool can't know the split).
   */
  honors10Semesters?: number;
  /**
   * Optional, for non-California applicants: how many of the honors semesters
   * were school-designated honors rather than AP or IB. For the 3.4 minimum UC
   * counts AP and IB honors only.
   */
  schoolHonorsSemesters?: number;
  /** Optional total SAT score (400-1600). Absent or out of range means "no score". */
  satScore?: number;
  /** Optional CSU GPA inputs (separate formula from the UC's). */
  csu?: CsuGpaInputs;
}

export interface CsuGpaInputs {
  /** How many A, B, C, D and F grades in "a-g" courses taken after 9th grade (pluses and minuses ignored). */
  a: number;
  b: number;
  c: number;
  d: number;
  f: number;
  /** Honors/AP/IB semesters taken in 10th grade, completed with a C or better. */
  honors10: number;
  /** Honors/AP/IB semesters taken in 11th and 12th grade, completed with a C or better. */
  honors1112: number;
}

export const CSU_MAX_HONORS_SEMESTERS = 8;
export const CSU_MAX_10TH_GRADE_HONORS = 2;

export interface CsuGpaResult {
  /** null until at least one grade is entered. */
  gpa: number | null;
  gradeCount: number;
  gradePoints: number;
  honorsPoints: number;
}

/**
 * CSU "a-g" GPA. calstate.edu/apply/gpa-calculator describes the inputs:
 * grades from all a-g courses after 9th grade (10th-12th), pluses/minuses
 * ignored, extra points for up to 8 semesters of honors/AP/IB/college courses
 * of which at most 2 semesters may be from 10th grade. The arithmetic isn't
 * written out on that page, so it was confirmed against CSU's own calculator
 * with test numbers on 2026-09-19 (see scripts/check-csu-gpa.mts):
 *   (4A + 3B + 2C + 1D + 0F + honors points) / number of grades.
 * College-course semesters count twice; the student adds those to the grade
 * counts as CSU instructs (a B in a college class is entered as two B's).
 */
export function calculateCsuGpa(input: CsuGpaInputs): CsuGpaResult {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  const gradeCount = clean(input.a) + clean(input.b) + clean(input.c) + clean(input.d) + clean(input.f);
  const gradePoints = 4 * clean(input.a) + 3 * clean(input.b) + 2 * clean(input.c) + clean(input.d);
  const honorsPoints = Math.min(
    Math.min(clean(input.honors10), CSU_MAX_10TH_GRADE_HONORS) + clean(input.honors1112),
    CSU_MAX_HONORS_SEMESTERS
  );
  return {
    gpa: gradeCount === 0 ? null : (gradePoints + honorsPoints) / gradeCount,
    gradeCount,
    gradePoints,
    honorsPoints,
  };
}

/**
 * What CSU's admission-requirements page says about a given a-g GPA. Only the
 * ranges the page lists are described; outside them the page says nothing, so
 * neither do we. `residency` null means unknown, so both are returned.
 */
export function csuGpaStatus(gpa: number): { residents: string; nonResidents: string } {
  const residents =
    gpa >= 2.5
      ? "At or above CSU's 2.50 GPA level for California residents."
      : gpa >= 2.0
        ? "In CSU's 2.00 to 2.49 range for California residents, where campuses may evaluate applicants on supplemental factors."
        : "Below the GPA range CSU's page lists for California residents.";
  const nonResidents =
    gpa >= 3.0
      ? "At or above CSU's 3.00 GPA level for non-residents."
      : gpa >= 2.47
        ? "In CSU's 2.47 to 2.99 range for non-residents, where campuses may evaluate applicants on supplemental factors."
        : "Below the GPA range CSU's page lists for non-residents.";
  return { residents, nonResidents };
}

export interface UcGpaResult {
  unweightedGpa: number;
  cappedHonorsSemesters: number;
  bonusPoints: number;
  ucCappedGpa: number;
}

export const UC_MAX_10TH_GRADE_HONORS = 4;

const nonNegative = (n: number | undefined) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0);

/**
 * UC's GPA, per admission.universityofcalifornia.edu/admission-requirements/
 * first-year-requirements/gpa-requirement.html: grade points (A=4 ... D=1)
 * for every A-G semester from summer after 9th grade through summer after
 * 11th grade, plus one extra point for each *eligible* honors semester (at
 * most 8 across 10th and 11th grade, at most 4 from 10th grade), divided by
 * the number of letter grades. Written here as unweighted GPA plus (honors
 * points / semesters), which is the same arithmetic. Verified against hand
 * -worked cases for the cap logic in scripts/check-uc-gpa.mts.
 *
 * `honors10Semesters`, when given, applies the 10th-grade limit; when it isn't,
 * only the overall 8 cap applies, since the split isn't known.
 *
 * IMPORTANT — this function trusts `honorsSemesters` as already eligible.
 * UC's own rule is "grades of D or F in an honors course do not earn an
 * extra point," which needs the grade earned in *each* honors course, not
 * just a count of how many were taken. That's why nothing in the live
 * student-profile flow (lib/profile.ts, app/matcher/page.tsx) calls this
 * function today — the profile only collects aggregate semester counts, not
 * per-course grades, so it can't itself guarantee that precondition holds
 * (a student could enter "6 honors semesters" that includes one they got a D
 * in). Rather than present a number that might silently ignore that rule,
 * the app compares UC schools using unweighted GPA alone (see
 * computeGpaSummary's cumulativeUnweighted) until real course-level input is
 * collected. This function stays correct and tested for whenever that
 * happens.
 */
export function calculateUcCappedGpa({
  unweightedGpa,
  totalSemesters,
  honorsSemesters,
  honors10Semesters,
}: GpaInputs): UcGpaResult {
  const safeTotalSemesters = Math.max(totalSemesters, 1);
  const honors = nonNegative(honorsSemesters);
  let counted = honors;
  if (honors10Semesters !== undefined) {
    const tenth = Math.min(nonNegative(honors10Semesters), honors);
    counted = Math.min(tenth, UC_MAX_10TH_GRADE_HONORS) + (honors - tenth);
  }
  const cappedHonorsSemesters = Math.min(counted, MAX_CAPPED_HONORS_SEMESTERS);
  const bonusPoints = cappedHonorsSemesters / safeTotalSemesters;
  const ucCappedGpa = unweightedGpa + bonusPoints;

  return {
    unweightedGpa,
    cappedHonorsSemesters,
    bonusPoints,
    ucCappedGpa,
  };
}

/**
 * UC GPA for judging the 3.4 minimum for a non-California applicant. UC gives
 * honors weight to AP and IB courses only, not school-designated honors, for
 * that check. Estimated as the same calculation with school-designated honors
 * semesters removed. It's an estimate: UC calculates the official GPA itself,
 * and the 10th-grade limit isn't split between AP/IB and school honors here.
 */
export function calculateUcNonResidentGpa(inputs: GpaInputs): UcGpaResult {
  const school = Math.min(nonNegative(inputs.schoolHonorsSemesters), nonNegative(inputs.honorsSemesters));
  return calculateUcCappedGpa({
    ...inputs,
    honorsSemesters: Math.max(nonNegative(inputs.honorsSemesters) - school, 0),
    honors10Semesters: inputs.honors10Semesters === undefined ? undefined : Math.max(nonNegative(inputs.honors10Semesters) - school, 0),
  });
}

/** What UC's requirements page says about a UC GPA: 3.0 for California residents, 3.4 for non-residents. */
export function ucMinimumStatus(gpa: number, resident: boolean): string {
  const need = resident ? 3.0 : 3.4;
  const who = resident ? "California residents" : "non-residents";
  return gpa >= need
    ? `At or above UC's ${need.toFixed(1)} GPA minimum for ${who}.`
    : `Below UC's ${need.toFixed(1)} GPA minimum for ${who}.`;
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
  return text
    .replace(/Your GPA/g, "Your student's GPA")
    .replace(/your GPA/g, "your student's GPA")
    .replace(/Your SAT score/g, "Your student's SAT score")
    .replace(/your SAT score/g, "your student's SAT score");
}

export function parseGpaRange(range: string): { low: number; high: number } | null {
  // Anchored to the start of the (trimmed) string so free-text fields that merely
  // *mention* a dash-separated pair of numbers (e.g. an unrelated enrolled-student
  // distribution note) aren't mistaken for an official mid-50% admitted range.
  const match = range.trim().match(/^(\d+\.\d+)\s*-\s*(\d+\.\d+)\b/);
  if (!match) return null;
  return { low: parseFloat(match[1]), high: parseFloat(match[2]) };
}

export function parseSatRange(range: string): { low: number; high: number } | null {
  const match = range.trim().match(/^(\d{3,4})\s*-\s*(\d{3,4})\b/);
  if (!match) return null;
  const low = parseInt(match[1], 10);
  const high = parseInt(match[2], 10);
  if (low < 400 || high > 1600 || low >= high) return null;
  return { low, high };
}

/** A usable SAT total is a whole-ish number in the real 400-1600 range; anything else means "no score entered". */
export function validSatScore(score: number | null | undefined): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 400 && score <= 1600;
}

// CSU uses its own GPA calculation, not UC's — and we don't have a verified
// CSU-specific formula in this codebase. Rather than build a guessed one,
// CSU falls back to the same treatment as Private/Public:
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
  studentValue: number,
  rangeLow: number,
  rangeHigh: number,
  admitRateOverall: number,
  { noun = "GPA", marginThreshold = 0.1 }: { noun?: string; marginThreshold?: number } = {}
): { category: AdmitRateLean; reason: string; band: "below" | "within" | "above" } {
  const band = studentValue < rangeLow ? "below" : studentValue > rangeHigh ? "above" : "within";

  // Sub-10% admit schools are lottery-like: never a true safety.
  if (admitRateOverall < 0.1) {
    if (band === "above") {
      return {
        category: "Reach",
        band,
        reason: `Your ${noun} is above the mid-50% range, but this school's sub-10% admit rate makes it a Reach for everyone.`,
      };
    }
    return {
      category: "Reach",
      band,
      reason: `This school's extremely low admit rate makes it a Reach regardless of ${noun}.`,
    };
  }

  if (band === "below") {
    return {
      category: "Reach",
      band,
      reason: `Your ${noun} falls below this school's typical mid-50% admitted range.`,
    };
  }

  if (band === "within") {
    if (admitRateOverall < 0.25) {
      return {
        category: "Reach",
        band,
        reason: `Your ${noun} is within range, but the admit rate is under 25%, so admission is still competitive.`,
      };
    }
    // A broad-admit school where the student is at or above the middle of the
    // range is Likely — being "within" range at a 75%-admit school isn't a
    // coin flip. Below the midpoint stays Target.
    if (admitRateOverall >= 0.6 && studentValue >= (rangeLow + rangeHigh) / 2) {
      return {
        category: "Safety",
        band,
        reason: `Your ${noun} is at or above the middle of this school's typical admitted range, at a school that admits most applicants.`,
      };
    }
    return {
      category: "Target",
      band,
      reason: `Your ${noun} sits within the typical mid-50% admitted range for this school.`,
    };
  }

  // band === "above"
  if (admitRateOverall < 0.25) {
    return {
      category: "Target",
      band,
      reason: `Your ${noun} is above the typical range, but low overall admit rate keeps this a Target for you, not Likely for you.`,
    };
  }
  if (admitRateOverall < 0.5) {
    const margin = studentValue - rangeHigh;
    if (margin > marginThreshold) {
      return {
        category: "Safety",
        band,
        reason: `Your ${noun} comfortably exceeds the mid-50% range at a moderately selective school.`,
      };
    }
    return {
      category: "Target",
      band,
      reason: `Your ${noun} is slightly above range at a moderately selective school.`,
    };
  }
  return {
    category: "Safety",
    band,
    reason: `Your ${noun} exceeds the typical admitted range at a school with a higher overall admit rate.`,
  };
}

const CATEGORY_RANK: Record<AdmitRateLean, number> = { Reach: 0, Target: 1, Safety: 2 };

/**
 * A rough Reach/Target/Likely estimate from admit rate alone, for a school
 * that publishes no GPA range (and has no usable SAT comparison either).
 * Always labeled "Estimated" wherever it's shown — this is a much weaker
 * signal than comparing the student's own numbers to a published range, and
 * should never be presented the same way as a real classification.
 */
function estimateFromAdmitRateOnly(admitRateOverall: number, satRangePublished: boolean): { category: AdmitRateLean; reason: string } {
  const satHint = satRangePublished
    ? " This school does publish an SAT range — add your SAT score above for a closer estimate."
    : "";
  if (admitRateOverall < 0.15) {
    return {
      category: "Reach",
      reason: `Estimated from this school's admit rate alone, since it doesn't publish a GPA range: under 15% admitted makes this a Reach for most applicants.${satHint}`,
    };
  }
  if (admitRateOverall < 0.4) {
    return {
      category: "Target",
      reason: `Estimated from this school's admit rate alone, since it doesn't publish a GPA range: this keeps it a realistic Target.${satHint}`,
    };
  }
  return {
    category: "Safety",
    reason: `Estimated from this school's admit rate alone, since it doesn't publish a GPA range: an admit rate this broad makes it Likely, though it isn't compared to your own numbers.${satHint}`,
  };
}

// 40 SAT points plays the role 0.1 GPA does in classifyFit: "comfortably" above
// the top of the range, at roughly a quarter of a typical mid-50% width.
const SAT_COMFORT_MARGIN = 40;

/**
 * Classifies a school as Safety / Target / Reach / Unrated.
 *
 * "Unrated" is returned whenever there is nothing real to compare the
 * student against — no published GPA band, and no usable SAT comparison. A
 * school is never silently placed into a real Safety/Target/Reach bucket
 * from admit rate alone, since that conflates "no data" with "we compared
 * your numbers and it's fine."
 *
 * `satScore` is optional. It's only compared when the school publishes an SAT
 * range and actually uses scores:
 * - Test-Required: the more cautious of the GPA and SAT results wins.
 * - Test-Optional: the published range only describes students who chose to
 *   submit, so a score *below* it isn't held against the student (they can
 *   simply not send it) — it's left out with a note. A score in or above the
 *   range can only help, so the better of the two results wins.
 * - Test-Blind / Test-Free: scores are never used.
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
  homeState?: string | null,
  satScore?: number | null
): FitResult | null {
  const useUcCapped = usesUcCappedMetric(college);
  const rangeStr = useUcCapped ? college.mid50_GPA_UCCapped : college.mid50_GPA_Unweighted;
  const parsed = parseGpaRange(rangeStr);
  const studentGpaUsed = useUcCapped ? ucCappedGpa : unweightedGpa;
  const { rate: admitRate, context: residencyContext } = resolveAdmitRate(college, residency, homeState);

  const gpaFit = parsed ? classifyFit(studentGpaUsed, parsed.low, parsed.high, admitRate) : null;

  const satRange = parseSatRange(college.mid50_SAT);
  const usesScores = college.testingPolicy === "Test-Required" || college.testingPolicy === "Test-Optional";
  let satFit =
    validSatScore(satScore) && satRange && usesScores
      ? classifyFit(satScore, satRange.low, satRange.high, admitRate, {
          noun: "SAT score",
          marginThreshold: SAT_COMFORT_MARGIN,
        })
      : null;
  let satNote: string | null = null;
  if (satFit && college.testingPolicy === "Test-Optional" && satFit.band === "below") {
    satNote =
      "Your SAT score is below the range of students who submitted one. This school is test-optional, so you can apply without a score.";
    satFit = null;
  }

  const sat =
    satFit && satRange && validSatScore(satScore) ? { score: satScore, low: satRange.low, high: satRange.high } : null;

  if (!gpaFit && !satFit) {
    if (!parsed) {
      // No GPA range published at all: fall back to an admit-rate-only estimate rather than
      // leaving the school entirely unclassified — always marked isEstimated so the UI can
      // label it clearly rather than presenting it as a real comparison.
      const estimate = estimateFromAdmitRateOnly(admitRate, satRange !== null);
      return {
        college,
        category: estimate.category,
        studentGpaUsed,
        gpaMetricLabel: "GPA band not reported",
        rangeLow: null,
        rangeHigh: null,
        reason: estimate.reason,
        residencyContext,
        sat: null,
        satNote,
        band: null,
        isEstimated: true,
      };
    }
    return {
      college,
      category: "Unrated",
      studentGpaUsed,
      gpaMetricLabel: "GPA band not reported",
      rangeLow: null,
      rangeHigh: null,
      reason: "This school doesn't publish a GPA range, so we can't compare your GPA to it.",
      residencyContext,
      sat: null,
      satNote,
      band: null,
      isEstimated: false,
    };
  }

  // Pick the driving result: alone if only one exists; otherwise cautious
  // (Test-Required) or best-of (Test-Optional). Ties go to GPA.
  let driver = (gpaFit ?? satFit)!;
  if (gpaFit && satFit) {
    const satIsBetter = CATEGORY_RANK[satFit.category] > CATEGORY_RANK[gpaFit.category];
    const useSat = college.testingPolicy === "Test-Optional" ? satIsBetter : CATEGORY_RANK[satFit.category] < CATEGORY_RANK[gpaFit.category];
    driver = useSat ? satFit : gpaFit;
  }

  return {
    college,
    category: driver.category,
    studentGpaUsed,
    gpaMetricLabel: useUcCapped ? "UC Capped GPA" : "Unweighted GPA",
    rangeLow: parsed?.low ?? null,
    rangeHigh: parsed?.high ?? null,
    reason: driver.reason,
    residencyContext,
    sat,
    satNote,
    band: driver.band,
    isEstimated: false,
  };
}
