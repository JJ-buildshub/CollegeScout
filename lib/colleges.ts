import rawColleges from "@/data/colleges.json";
import type { College, FieldProvenance } from "./types";

export const colleges = rawColleges as unknown as College[];

export function getCollegeById(id: string): College | undefined {
  return colleges.find((c) => c.id === id);
}

export const SYSTEMS = ["UC", "CSU", "Private", "Public"] as const;

export const TESTING_POLICIES = ["Test-Free", "Test-Required", "Test-Optional", "Test-Blind", "Not verified"] as const;

export function formatPercent(value: number | null): string {
  if (value === null) return "Not publicly reported";
  return `${Math.round(value * 100)}%`;
}

/**
 * The admit-rate range behind each band name, for use wherever the band is shown
 * without a percentage beside it. A student has no way to know what
 * "Ultra-Selective" means; the number defines it without a sentence of gloss.
 */
export const ADMIT_TIER_RANGE: Record<string, string> = {
  "Ultra-Selective": "under 15% admitted",
  "Highly Selective": "15–35% admitted",
  Selective: "35–60% admitted",
  Accessible: "over 60% admitted",
};

export function admitRateTier(rate: number): string {
  if (rate < 0.15) return "Ultra-Selective";
  if (rate < 0.35) return "Highly Selective";
  if (rate < 0.6) return "Selective";
  return "Accessible";
}

export interface DisplayedAdmitRate {
  value: number;
  /** Non-null only when the displayed figure came from College Scorecard — the curated field has no per-field provenance populated yet (see admissionsProvenance). */
  provenance: FieldProvenance | null;
  superseded: boolean;
}

/**
 * The single source of truth for "what overall admit rate do we show for
 * this school" — every display surface (directory cards, profile pages,
 * Matcher cards, homepage widgets, filtering/sorting) should call this
 * instead of reading `college.admitRateOverall` directly, so the
 * Scorecard-as-default switch applies everywhere consistently rather than
 * needing to be replicated ad hoc per component.
 *
 * Note this is a *display* choice only — it has nothing to do with what
 * lib/gpa.ts's Matcher classifies against, which follows its own,
 * separate rule (curated for schools with a real residency split,
 * Scorecard otherwise) because classification cares about residency and
 * Scorecard has none.
 */
export function displayedAdmitRate(college: College): DisplayedAdmitRate {
  const scorecard = college.scorecard?.admitRateOverall;
  if (college.admitRateOverallSuperseded && scorecard?.value != null) {
    return { value: scorecard.value, provenance: scorecard.provenance, superseded: true };
  }
  return { value: college.admitRateOverall, provenance: null, superseded: false };
}
