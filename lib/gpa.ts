import type { College, FitCategory, FitResult } from "./types";

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

export function parseGpaRange(range: string): { low: number; high: number } | null {
  const match = range.match(/(\d+\.\d+)\s*-\s*(\d+\.\d+)/);
  if (!match) return null;
  return { low: parseFloat(match[1]), high: parseFloat(match[2]) };
}

function usesUcCappedMetric(college: College): boolean {
  return college.system === "UC" || college.system === "CSU";
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
): { category: FitCategory; reason: string } {
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
      reason: "Your GPA is above the typical range, but low overall admit rate keeps this a Target, not a Safety.",
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
function classifyFitByAdmitRateOnly(admitRateOverall: number): { category: FitCategory; reason: string } {
  if (admitRateOverall < 0.1) {
    return {
      category: "Reach",
      reason:
        "No GPA band is publicly reported for this school. Its sub-10% admit rate alone makes it a Reach for nearly everyone.",
    };
  }
  if (admitRateOverall < 0.4) {
    return {
      category: "Target",
      reason: "No GPA band is publicly reported for this school, so it's classified as a Target based on admit rate alone.",
    };
  }
  return {
    category: "Safety",
    reason: "No GPA band is publicly reported for this school, but its broad overall admit rate makes it a reasonable Safety based on admit rate alone.",
  };
}

export function evaluateCollegeFit(
  college: College,
  ucCappedGpa: number,
  unweightedGpa: number
): FitResult | null {
  const useUcCapped = usesUcCappedMetric(college);
  const rangeStr = useUcCapped ? college.mid50_GPA_UCCapped : college.mid50_GPA_Unweighted;
  const parsed = parseGpaRange(rangeStr);
  const studentGpaUsed = useUcCapped ? ucCappedGpa : unweightedGpa;

  if (!parsed) {
    const { category, reason } = classifyFitByAdmitRateOnly(college.admitRateOverall);
    return {
      college,
      category,
      studentGpaUsed,
      gpaMetricLabel: "GPA band not reported",
      rangeLow: null,
      rangeHigh: null,
      reason,
    };
  }

  const { category, reason } = classifyFit(
    studentGpaUsed,
    parsed.low,
    parsed.high,
    college.admitRateOverall
  );

  return {
    college,
    category,
    studentGpaUsed,
    gpaMetricLabel: useUcCapped ? "UC Capped GPA" : "Unweighted GPA",
    rangeLow: parsed.low,
    rangeHigh: parsed.high,
    reason,
  };
}
