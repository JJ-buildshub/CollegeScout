"use client";

import type { Grade } from "./types";
import { createLocalStore } from "./store";

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
  /**
   * Optional, temporary "compare as if I lived in ___" scenario — e.g. a family
   * deciding between states, or checking a school's out-of-state numbers without
   * losing their real home state. Applies to every school's residency lookup in
   * place of `homeState` while set; persisted like everything else in this
   * profile, and cleared explicitly (never silently) — see the "Compare as
   * another state" control on My Fit.
   */
  residencyScenario: string | null;
  grade: Grade | null;
  /** Up to 3 fields, each with its own chosen sub-areas. Ignored (and cleared) when undecided is true. */
  interests: InterestChoice[];
  undecided: boolean;
  yearGpas: Partial<Record<Grade, YearGpa>>;
  satScore: number | null;
  /**
   * The student's own UC-capped weighted GPA, calculated by them elsewhere
   * using UC's real A-G methodology — see UcCappedGpaField and
   * lib/gpa.ts's evaluateUcFit. Never derived from `yearGpas` or anything
   * else in this profile; null means "not entered," in which case UC
   * campuses are classified as a Limited-data estimate from admit rate
   * alone, never from school-reported GPA.
   */
  ucCappedGpaSelfReported: number | null;
}

export const MAX_INTERESTS = 3;

export const EMPTY_PROFILE: StudentProfile = {
  planningFor: "self",
  homeState: null,
  residencyScenario: null,
  grade: null,
  interests: [],
  undecided: false,
  yearGpas: {},
  satScore: null,
  ucCappedGpaSelfReported: null,
};

const PROFILE_STORAGE_KEY = "collegescout:profile";
/**
 * v2 (2026-09-21 QA pass): dropped `ucGpaCalculator` (see lib/gpa.ts's note on
 * calculateUcCappedGpa for why — the aggregate semester/honors counts it took
 * can't enforce UC's "no honors point for a D or F" rule) and added
 * `residencyScenario`.
 * v3 (2026-09-22 UC accuracy correction): added `ucCappedGpaSelfReported` —
 * the one number UC fit classification will ever use (see evaluateUcFit in
 * lib/gpa.ts); school-reported GPA and SAT are never used for UC schools.
 * `migrate` below only ever reads the fields it recognizes, so an older
 * record's now-removed fields are simply not carried forward — never an
 * error, never guessed at.
 */
const PROFILE_SCHEMA_VERSION = 3;
const OLD_GPA_KEY = "pathfinder-admit:gpa-inputs";
const OLD_PLANNING_FOR_KEY = "pathfinder-admit:planning-for";
const OLD_HOME_STATE_KEY = "pathfinder-admit:home-state";

/**
 * One-time bridge from the old, page-local Matcher inputs to the shared
 * profile, so a returning visitor doesn't lose their home state, planning
 * choice, or SAT score just because this feature reorganized where they
 * live. Only reads the old keys; never writes them, so they simply go stale
 * afterward rather than being deleted. The old key's semester/honors counts
 * (`totalSemesters`/`honorsSemesters`/etc.) are deliberately not migrated —
 * that calculator no longer exists (see PROFILE_SCHEMA_VERSION above).
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
      const old = JSON.parse(rawGpa) as { satScore?: number };
      if (typeof old.satScore === "number") patch.satScore = old.satScore;
    }
    return patch;
  } catch {
    return {};
  }
}

/**
 * Only pulls fields this version of StudentProfile actually recognizes, so a
 * removed field (like v1's `ucGpaCalculator`) is dropped cleanly rather than
 * carried along as dead data, and an unrecognized/corrupted shape falls back
 * to EMPTY_PROFILE per field rather than as an all-or-nothing reset.
 */
function migrate(raw: unknown, _storedVersion: number): StudentProfile {
  const parsed = (raw ?? {}) as Partial<Record<keyof StudentProfile, unknown>>;
  const pick = <K extends keyof StudentProfile>(key: K): StudentProfile[K] => {
    const value = parsed[key];
    return value === undefined ? EMPTY_PROFILE[key] : (value as StudentProfile[K]);
  };
  return {
    planningFor: pick("planningFor"),
    homeState: pick("homeState"),
    residencyScenario: pick("residencyScenario"),
    grade: pick("grade"),
    interests: pick("interests"),
    undecided: pick("undecided"),
    yearGpas: pick("yearGpas"),
    satScore: pick("satScore"),
    ucCappedGpaSelfReported: pick("ucCappedGpaSelfReported"),
  };
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

export function setUcCappedGpaSelfReported(value: number | null) {
  store.set((prev) => ({ ...prev, ucCappedGpaSelfReported: value }));
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
   * require course-level A-G grade data this profile doesn't collect (see the
   * note on calculateUcCappedGpa in lib/gpa.ts for why a real UC-capped figure
   * isn't calculated anywhere in this app right now).
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
