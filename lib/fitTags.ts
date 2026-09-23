import type { College, FitResult } from "./types";

/** Interest field ids (from lib/interests.ts) whose majors are worth flagging when a school admits them separately. */
const CS_ENGINEERING_INTEREST_IDS = new Set(["engineering", "cs-ai"]);

const CS_ENGINEERING_MAJOR_PATTERN = /computer science|engineering|computing/i;

/**
 * A caution when Engineering or Computer Science is one of the student's
 * chosen interests *and* this school's own admissions data (impactedMajors —
 * already sourced per-school, the same field CollegeProfileDashboard shows
 * under "Impacted Majors") lists a matching major as separately admitted and
 * more selective. Returns null whenever there's nothing to flag, or nothing
 * official to flag it with — never inferred from a school's reputation.
 *
 * Verified official-source gate (2026-09-21 QA pass): `impactedMajors` has no
 * per-field FieldProvenance of its own, but every school with entries here
 * also carries a whole-record `dataProvenance.sourcedFrom` of "Institutional
 * Website" and/or "Common Data Set (Institutional)" — checked directly
 * against data/colleges.json, e.g. UC Berkeley's four impacted majors are
 * sourced from its own Institutional Website. That's a real official source,
 * unlike `financials.meritAidNote` below.
 */
export function majorCautionFor(college: College, interestFieldIds: string[]): string | null {
  const caresAboutCsOrEng = interestFieldIds.some((id) => CS_ENGINEERING_INTEREST_IDS.has(id));
  if (!caresAboutCsOrEng) return null;
  const flagged = college.impactedMajors.filter((m) => CS_ENGINEERING_MAJOR_PATTERN.test(m));
  if (flagged.length === 0) return null;
  return `${flagged.join(", ")} ${flagged.length === 1 ? "is" : "are"} admitted separately here and more selective than the overall rate (per the school's own admissions data).`;
}

/** Shown on the tag itself — deliberately hedged, since this is never a promise of an actual award. */
export const MERIT_AID_TAG_LABEL = "Potential merit-aid opportunity";

/**
 * Always false for now — checked and reverted during the 2026-09-21 QA pass.
 *
 * `financials.meritAidNote` is free text, and its own type comment already
 * says it's "an interpretive counseling note, not a verified figure." Gating
 * on the field merely being non-null (the earlier version of this function)
 * was backwards in practice: of the 125 schools with a note, most —
 * including every UC campus and Stanford — explicitly say they do NOT offer
 * merit aid ("UC Berkeley offers essentially no merit scholarships...",
 * "Stanford offers no merit aid at all..."). Only a minority (e.g. SDSU) are
 * genuinely affirmative. There's no structured, sourced boolean in the data
 * model for "this school confirms it offers undergraduate merit aid," and
 * pattern-matching the free text for affirmative language risks
 * misclassifying a negative note as a positive one. Until a real field like
 * that exists, this tag never shows rather than guess from a field whose
 * content is often the opposite of what its presence would suggest.
 */
export function meritAidEligible(_result: FitResult): boolean {
  return false;
}
