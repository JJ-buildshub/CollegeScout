import reviewedTestPolicies from "@/data/reviewed-test-policies.json";
import reviewedDeadlines from "@/data/reviewed-deadlines.json";

/**
 * The date of the last weekly data-decay run (.github/workflows/data-decay-check.yml)
 * whose results were reviewed and fixed. Update it after reviewing each run.
 */
export const LAST_DATA_CHECK = "2026-10-18";

interface Reviewed {
  schools: Record<string, { manual?: boolean }>;
}

/** True when the weekly check re-reads this entry from the college's page; `manual` entries refuse automated requests and are read by hand instead. */
function autoChecked(file: Reviewed, collegeId: string): boolean {
  const entry = file.schools[collegeId];
  return !!entry && !entry.manual;
}

/**
 * What the last weekly check confirmed for one college, as a sentence for its
 * profile, or null when the check covers none of its facts. Names only what was
 * checked, so a profile never claims a date for figures nobody re-read.
 */
export function dataCheckNote(collegeId: string): string | null {
  const testing = autoChecked(reviewedTestPolicies as unknown as Reviewed, collegeId);
  const deadlines = autoChecked(reviewedDeadlines as unknown as Reviewed, collegeId);
  if (!testing && !deadlines) return null;
  const what = testing && deadlines ? "Testing policy and deadlines" : testing ? "Testing policy" : "Deadlines";
  const [year, month, day] = LAST_DATA_CHECK.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${what} checked against the college's own pages on ${MONTHS[month - 1]} ${day}, ${year}.`;
}
