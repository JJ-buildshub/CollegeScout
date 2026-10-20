import rawTalent from "@/data/college-talent.json";
import rawAthletics from "@/data/athletics.json";
import type { PathwaySource } from "./pathways";

/**
 * What one college asks of musicians and athletes, shown in the Beyond Grades
 * section of its profile. Two sources:
 * - data/college-talent.json: facts quoted from the college's own pages
 *   (checked by scripts/check-pathways.mjs);
 * - data/athletics.json: association, division and varsity sports from the
 *   federal EADA and IPEDS surveys (built by scripts/import-athletics.mjs).
 * A college with nothing in either has no section, rather than an empty one.
 */
export interface TalentFact {
  text: string;
  sources: PathwaySource[];
}

export interface CollegeAthletics {
  association: string;
  division?: string;
  sports?: string[];
}

/** Carried with each college's athletics rather than imported by the card, so the client bundle never pulls in the data files. */
export interface AthleticsWithSource extends CollegeAthletics {
  source: { label: string; url: string };
}

export interface CollegeTalent {
  music: TalentFact[];
  sports: TalentFact[];
  athletics: AthleticsWithSource | null;
}

interface TalentFile {
  checked: string;
  colleges: Record<string, { music?: TalentFact[]; sports?: TalentFact[] }>;
}

interface AthleticsFile {
  source: string;
  year: string;
  byCollege: Record<string, CollegeAthletics>;
}

const talent = rawTalent as unknown as TalentFile;
const athletics = rawAthletics as unknown as AthleticsFile;

const ATHLETICS_SOURCE = {
  label: `U.S. Department of Education, Equity in Athletics data (${athletics.year})`,
  url: "https://ope.ed.gov/athletics/",
};

export function getCollegeTalent(collegeId: string): CollegeTalent | null {
  const entry = talent.colleges[collegeId] ?? {};
  const result: CollegeTalent = {
    music: entry.music ?? [],
    sports: entry.sports ?? [],
    athletics: athletics.byCollege[collegeId] ? { ...athletics.byCollege[collegeId], source: ATHLETICS_SOURCE } : null,
  };
  const hasAny = result.music.length > 0 || result.sports.length > 0 || result.athletics !== null;
  return hasAny ? result : null;
}
