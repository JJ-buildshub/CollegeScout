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
 * True only when both are real: an official source says this school offers
 * undergraduate merit aid at all (`financials.meritAidNote`, the one field in
 * the data model backed by a school's own aid page — see lib/types.ts), *and*
 * the student's actual GPA/SAT sits above the top of the published admitted
 * range at a Likely school, the group most often considered for it. Without
 * the official-source half, GPA/SAT strength alone says nothing about
 * whether a school offers merit aid at all, so the tag never shows.
 */
export function meritAidEligible(result: FitResult): boolean {
  const officialMeritAidSignal = result.college.financials.meritAidNote !== null;
  return officialMeritAidSignal && result.category === "Safety" && result.band === "above" && !result.isEstimated;
}
