import rawMerit from "@/data/college-merit.json";
import type { TalentFact } from "./collegeTalent";

/**
 * Big merit scholarships tied to one college (Robertson, Park, Levine and the
 * like), from data/college-merit.json. Shown in the Financial Aid section of
 * that college's profile, because a family only finds them by looking at the
 * school, and most have an early deadline of their own. Facts are quoted from
 * the scholarship's own pages and checked by scripts/check-pathways.mjs.
 * A college with no entry has no card, rather than an empty one.
 */
export interface MeritScholarship {
  name: string;
  /** Short headline, e.g. "Full ride". */
  award: string;
  /** The scholarship's own first deadline for this cycle, e.g. "Nov 15". */
  deadline: string;
  facts: TalentFact[];
}

interface MeritFile {
  checked: string;
  colleges: Record<string, MeritScholarship[]>;
}

const merit = rawMerit as unknown as MeritFile;

export function getCollegeMerit(collegeId: string): MeritScholarship[] {
  return merit.colleges[collegeId] ?? [];
}
