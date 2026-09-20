import rawApplications from "@/data/applications.json";

/**
 * What a school asks applicants to write and submit, researched from the
 * school's own admissions pages (or the application platform's), never
 * guessed. Kept in its own file, keyed by college id, so it can grow school by
 * school without touching colleges.json.
 *
 * Prompts are quoted word for word from the school's page and only when that
 * page shows them; a school we have limits for but no prompts for simply
 * shows the limits. Nothing is reworded, and every entry says when it was
 * read, because schools change prompts every year.
 */
export interface WritingItem {
  /** e.g. "Short essays" or "Personal Insight Questions". */
  title: string;
  /** Word limit in the school's terms, e.g. "100-250 words each". null when the page gives none. */
  limit: string | null;
  /** How many to answer, e.g. "Answer 4 of these 8." */
  note?: string;
  /** Exact prompt wording from the school's page. Empty when the page doesn't show them. */
  prompts: string[];
  /** A page to read the prompts on, when the school links out (e.g. the Common App). */
  link?: { label: string; url: string };
}

export interface ApplicationInfo {
  /** Where students apply, e.g. ["Common App"]. Empty when the page we read doesn't say. */
  platforms: string[];
  mainEssay: WritingItem;
  /** Required school-specific writing. */
  requiredWriting: WritingItem[];
  /** Optional school-specific writing. */
  optionalWriting: WritingItem[];
  /** Anything else that changes the work involved. */
  extras: string[];
  /** The school's own page with this year's prompts. */
  essayPageUrl: string;
  source: {
    url: string;
    /** ISO date the page was read. */
    checked: string;
    /** Admissions cycle, only when the page itself states it. */
    cycle: string | null;
  };
}

interface ApplicationsFile {
  byCollege: Record<string, ApplicationInfo>;
}

const applications = rawApplications as unknown as ApplicationsFile;

export function getApplicationInfo(collegeId: string): ApplicationInfo | null {
  return applications.byCollege[collegeId] ?? null;
}
