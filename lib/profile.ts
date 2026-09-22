"use client";

import type { Grade } from "./types";
import { createLocalStore } from "./store";

/**
 * The direct semester/honors counts UC's real GPA formula needs (see
 * calculateUcCappedGpa in lib/gpa.ts) — deliberately not the full GpaInputs
 * shape, since the unweighted GPA half of that formula comes from the
 * yearly-trend cumulative average (a plain arithmetic mean, always freshly
 * computed by computeGpaSummary) rather than being duplicated and stored
 * here.
 */
export interface UcGpaCalculatorInputs {
  totalSemesters: number;
  honorsSemesters: number;
  honors10Semesters?: number;
  schoolHonorsSemesters?: number;
}

export type PlanningFor = "self" | "student";

export interface InterestChoice {
  fieldId: string;
  subAreas: string[];
}

/**
 * A year's GPA as reported on a transcript. `weighted` is optional and, wherever it's
 * displayed, must be labeled "school-reported" — schools compute weighted GPA under their
 * own, unverified formulas, so this is never recalculated or treated as authoritative.
 * Neither value is ever used to calculate a UC or CSU GPA (see the note on GpaSummary below);
 * they're for the student's own year-over-year trend only.
 */
export interface YearGpa {
  unweighted: number | null;
  weighted: number | null;
}

export interface StudentProfile {
  planningFor: PlanningFor;
  homeState: string | null;
  grade: Grade | null;
  /** Up to 3 fields, each with its own chosen sub-areas. Ignored (and cleared) when undecided is true. */
  interests: InterestChoice[];
  undecided: boolean;
  yearGpas: Partial<Record<Grade, YearGpa>>;
  /**
   * Direct semester/honors counts for UC's real GPA formula — the same inputs
   * lib/gpa.ts's calculateUcCappedGpa always required. Kept separate from yearGpas
   * on purpose: UC's GPA needs actual A-G semester and honors-semester counts, which
   * can't be reconstructed from a yearly unweighted/weighted GPA pair without
   * course-level data we don't collect. Null until the student fills in this
   * calculator; fit classification for UC schools falls back to assuming zero
   * honors semesters (i.e. UC-capped GPA equal to unweighted GPA) until they do,
   * which undercounts rather than guesses.
   */
  ucGpaCalculator: UcGpaCalculatorInputs | null;
  satScore: number | null;
}

export const MAX_INTERESTS = 3;

export const EMPTY_PROFILE: StudentProfile = {
  planningFor: "self",
  homeState: null,
  grade: null,
  interests: [],
  undecided: false,
  yearGpas: {},
  ucGpaCalculator: null,
  satScore: null,
};

const PROFILE_STORAGE_KEY = "collegescout:profile";
const PROFILE_SCHEMA_VERSION = 1;
const OLD_GPA_KEY = "pathfinder-admit:gpa-inputs";
const OLD_RESIDENCY_KEY = "pathfinder-admit:residency";
const OLD_PLANNING_FOR_KEY = "pathfinder-admit:planning-for";
const OLD_HOME_STATE_KEY = "pathfinder-admit:home-state";

/**
 * One-time bridge from the old, page-local Matcher inputs to the shared
 * profile, so a returning visitor doesn't lose their home state, planning
 * choice, or UC GPA calculator inputs just because this feature reorganized
 * where they live. Only reads the old keys; never writes them, so they simply
 * go stale afterward rather than being deleted.
 */
function migrateLegacyProfile(): Partial<StudentProfile> {
  if (typeof window === "undefined") return {};
  try {
    const patch: Partial<StudentProfile> = {};
    const planningFor = window.localStorage.getItem(OLD_PLANNING_FOR_KEY);
    if (planningFor === "self" || planningFor === "student") patch.planningFor = planningFor;
    const homeState = window.localStorage.getItem(OLD_HOME_STATE_KEY);
    if (homeState) patch.homeState = homeState;
    const rawGpa = window.localStorage.getItem(OLD_GPA_KEY);
    if (rawGpa) {
      const old = JSON.parse(rawGpa) as {
        totalSemesters?: number;
        honorsSemesters?: number;
        honors10Semesters?: number;
        schoolHonorsSemesters?: number;
        satScore?: number;
      };
      if (typeof old.totalSemesters === "number" && typeof old.honorsSemesters === "number") {
        patch.ucGpaCalculator = {
          totalSemesters: old.totalSemesters,
          honorsSemesters: old.honorsSemesters,
          honors10Semesters: old.honors10Semesters,
          schoolHonorsSemesters: old.schoolHonorsSemesters,
        };
      }
      if (typeof old.satScore === "number") patch.satScore = old.satScore;
    }
    return patch;
  } catch {
    return {};
  }
}

function migrate(raw: unknown): StudentProfile {
  const parsed = (raw ?? {}) as Partial<StudentProfile>;
  return { ...EMPTY_PROFILE, ...parsed };
}

const store = createLocalStore<StudentProfile>(PROFILE_STORAGE_KEY, EMPTY_PROFILE, PROFILE_SCHEMA_VERSION, migrate);

let legacyChecked = false;
function withLegacyMigration(): StudentProfile {
  const current = store.get();
  if (!legacyChecked && typeof window !== "undefined") {
    legacyChecked = true;
    const hasOwnData = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!hasOwnData) {
      const legacy = migrateLegacyProfile();
      if (Object.keys(legacy).length > 0) {
        store.set({ ...current, ...legacy });
        return store.get();
      }
    }
  }
  return current;
}

export function useProfile() {
  const [profile, setProfile] = store.useStore();
  return { profile: legacyChecked ? profile : (withLegacyMigration(), profile), setProfile, corrupted: store.wasCorrupted() };
}

export function getProfile(): StudentProfile {
  return withLegacyMigration();
}

export function updateProfile(patch: Partial<StudentProfile>) {
  store.set((prev) => ({ ...prev, ...patch }));
}

/** Wipes the student profile back to empty, in this browser only. Part of "Reset my data." */
export function resetProfile() {
  store.reset();
}

export function profileWasCorrupted(): boolean {
  return store.wasCorrupted();
}

export function setYearGpa(grade: Grade, entry: YearGpa) {
  store.set((prev) => ({ ...prev, yearGpas: { ...prev.yearGpas, [grade]: entry } }));
}

export function setUcGpaCalculator(inputs: UcGpaCalculatorInputs | null) {
  store.set((prev) => ({ ...prev, ucGpaCalculator: inputs }));
}

/** Which grades' GPA the student should be entering: completed years plus the current one. */
export function gpaYearsFor(grade: Grade | null): Grade[] {
  if (grade === null) return [];
  return ([9, 10, 11, 12] as Grade[]).filter((g) => g <= grade);
}

export interface YearTrendEntry {
  grade: Grade;
  unweighted: number;
  /** School-reported; not recalculated or verified. */
  weighted: number | null;
  /** True for the student's current grade — that year's transcript isn't final yet. */
  inProgress: boolean;
}

export interface GpaSummary {
  /**
   * A simple average of each entered year's unweighted GPA, weighted by semester
   * count — a plain arithmetic mean, not a UC or CSU GPA calculation. Those
   * require course-level A-G grade data this profile doesn't collect (see
   * ucGpaCalculator above for the one place we do calculate a real UC GPA, from
   * direct semester/honors input rather than derived from yearly GPA).
   */
  cumulativeUnweighted: number | null;
  yearsEntered: number;
  /** Year-by-year, for trend display only — never fed into a GPA formula. */
  trend: YearTrendEntry[];
}

const SEMESTERS_PER_YEAR = 2;

export function computeGpaSummary(profile: StudentProfile): GpaSummary {
  const years = gpaYearsFor(profile.grade)
    .map((grade) => ({ grade, entry: profile.yearGpas[grade] }))
    .filter((y): y is { grade: Grade; entry: YearGpa } => y.entry?.unweighted != null);

  const trend: YearTrendEntry[] = years.map((y) => ({
    grade: y.grade,
    unweighted: y.entry.unweighted as number,
    weighted: y.entry.weighted,
    inProgress: y.grade === profile.grade,
  }));

  if (years.length === 0) {
    return { cumulativeUnweighted: null, yearsEntered: 0, trend };
  }

  const totalSemesters = years.length * SEMESTERS_PER_YEAR;
  const sumUnweighted = years.reduce((s, y) => s + (y.entry.unweighted ?? 0) * SEMESTERS_PER_YEAR, 0);
  const cumulativeUnweighted = sumUnweighted / totalSemesters;

  return { cumulativeUnweighted, yearsEntered: years.length, trend };
}
