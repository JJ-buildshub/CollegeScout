import raw from "@/data/scholarships.json";

/**
 * Scholarships and competitions a student can apply for while in high school,
 * quoted from the sponsoring organization's own pages. See
 * scripts/check-scholarships.mjs, which verifies each evidence line against the
 * live page. A field we could not source holds NOT_CONFIRMED (or an empty list)
 * and is rendered as "Not confirmed yet" rather than left out.
 */
export const NOT_CONFIRMED = "Not confirmed";
export const FEE_NOT_STATED = "Not stated on the sponsor's pages";

export type ScholarshipGrade = 9 | 10 | 11 | 12;
export const SCHOLARSHIP_GRADES: ScholarshipGrade[] = [9, 10, 11, 12];

export interface ScholarshipSource {
  label: string;
  url: string;
  /** ISO date the page was read. */
  accessed: string;
  evidence: string[];
  /** Read in a browser because the site refuses automated requests; the checker skips it. */
  manual?: boolean;
}

export interface Scholarship {
  id: string;
  name: string;
  runBy: string;
  homepage: string;
  kind: "scholarship" | "competition" | "program";
  /**
   * Our own short wording of the sourced fields below, for the collapsed card.
   * Absent on a record that has only been researched, not yet summarized.
   */
  prize?: string;
  /** What the student makes or does: "Essay", "2-minute video". */
  task?: string;
  tagline?: string;
  /** This cycle's deadline as an ISO date, when there is a single national one. */
  closes?: string | null;
  deadlineShort?: string;
  /** A gate most students will not pass, such as a family membership. Shown on the collapsed card. */
  only?: string;
  /** True when a student enters through a local club, chapter, post or lodge, or the program serves one region. */
  local?: boolean;
  /** The organization's own club or chapter finder. */
  findLocal?: string;
  /** Short label for where a regional program applies: "San Diego County". */
  area?: string;
  /** Two-letter state, for a program open only to that state's students. */
  state?: string;
  /** Counties or area served, when the sponsor states it. */
  region?: string;
  /** Counties the program serves, as named on its own pages. */
  counties?: string[];
  /** Covers part of its state, but the pages do not name the counties. */
  areaCheck?: boolean;
  /** Open across its whole state. */
  statewide?: boolean;
  /** Grades in which a student applies or enters. */
  grades: ScholarshipGrade[];
  award: string;
  eligibility: string[];
  whatYouSubmit: string[];
  howToApply: string[];
  prepare: string[];
  opens: string;
  deadline: string;
  cycle: string;
  fee: string;
  notes: string;
  sources: ScholarshipSource[];
}

/** A well-known program whose rules no longer match what students are commonly told. */
export interface ChangedProgram {
  id: string;
  name: string;
  runBy: string;
  homepage: string;
  /** The common belief, in our words. Not sourced. */
  heard: string;
  /** What the sponsor's page says now, summarizing the quoted lines. */
  now: string;
  sources: ScholarshipSource[];
}

const data = raw as unknown as {
  checked: string;
  programs: Record<string, Omit<Scholarship, "id">>;
  changed?: Record<string, Omit<ChangedProgram, "id">>;
};

export const changedPrograms: ChangedProgram[] = Object.entries(data.changed ?? {}).map(([id, program]) => ({
  id,
  ...program,
}));

/** ISO date the file was last checked against the live pages. */
export const scholarshipsChecked = data.checked;

export const scholarships: Scholarship[] = Object.entries(data.programs)
  .map(([id, program]) => ({ id, ...program }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Whole days from `today` to the program's deadline; negative once it has passed, null if it has no single date. */
export function daysLeft(program: Scholarship, today: Date): number | null {
  if (!program.closes) return null;
  const end = new Date(`${program.closes}T23:59:59`);
  return Math.floor((end.getTime() - today.getTime()) / 86_400_000);
}

/** True when the sponsor says outright that entering costs nothing. */
export function isFree(program: Scholarship): boolean {
  return /^(free|no (cost|fee))/i.test(program.fee);
}

export function isConfirmed(value: string): boolean {
  return value.trim() !== "" && !value.startsWith(NOT_CONFIRMED);
}

/** Drops list items that say a detail could not be sourced; the card's "Heads up" note covers those. */
export function confirmedItems(items: string[]): string[] {
  return items.filter((item) => item.trim() !== "" && !item.includes(NOT_CONFIRMED));
}
