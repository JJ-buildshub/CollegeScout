import reviewedTestPolicies from "@/data/reviewed-test-policies.json";
import reviewedDeadlines from "@/data/reviewed-deadlines.json";

/**
 * The date of the last weekly data-decay run (.github/workflows/data-decay-check.yml)
 * whose results were reviewed and fixed. Update it after reviewing each run.
 */
export const LAST_DATA_CHECK = "2026-10-18";

interface Reviewed {
  schools: Record<string, { manual?: boolean; accessed?: string }>;
}

/**
 * When this entry was last confirmed against the college's own page, or null.
 * The weekly check re-reads every automatic entry; a `manual` entry (a page that
 * refuses automated requests) counts only when a person read it in a browser on
 * or after that run, on its `accessed` date.
 */
function checkedOn(file: Reviewed, collegeId: string): string | null {
  const entry = file.schools[collegeId];
  if (!entry) return null;
  if (!entry.manual) return LAST_DATA_CHECK;
  return entry.accessed && entry.accessed >= LAST_DATA_CHECK ? entry.accessed : null;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/**
 * What was last confirmed for one college, as a sentence for its profile, or
 * null when nothing was. Names only what was checked, so a profile never claims
 * a date for figures nobody re-read.
 */
export function dataCheckNote(collegeId: string): string | null {
  const testing = checkedOn(reviewedTestPolicies as unknown as Reviewed, collegeId);
  const deadlines = checkedOn(reviewedDeadlines as unknown as Reviewed, collegeId);
  const where = "checked against the college's own pages on";
  if (testing && deadlines && testing === deadlines) return `Testing policy and deadlines ${where} ${formatDate(testing)}.`;
  if (testing && deadlines) return `Testing policy ${where} ${formatDate(testing)}; deadlines on ${formatDate(deadlines)}.`;
  if (testing) return `Testing policy ${where} ${formatDate(testing)}.`;
  if (deadlines) return `Deadlines ${where} ${formatDate(deadlines)}.`;
  return null;
}
