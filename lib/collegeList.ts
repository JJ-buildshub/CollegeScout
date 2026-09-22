"use client";

import { createLocalStore } from "./store";

/** The one status a school can have, shared by Explore, My Fit, My Plan and the college profile. */
export type SchoolStatus = "Saved" | "Applying" | "Submitted" | "Decision received";

export const STATUS_ORDER: SchoolStatus[] = ["Saved", "Applying", "Submitted", "Decision received"];

/** The plan the student is applying under — a separate field from status, not a status itself. */
export type ApplicationRound = "ED" | "EA" | "REA" | "RD";

export const ROUND_LABELS: Record<ApplicationRound, string> = {
  ED: "Early Decision",
  EA: "Early Action",
  REA: "Restrictive Early Action",
  RD: "Regular Decision",
};

export interface CollegeListEntry {
  collegeId: string;
  status: SchoolStatus;
  round: ApplicationRound | null;
  addedAt: string;
  updatedAt: string;
}

interface CollegeListState {
  entries: Record<string, CollegeListEntry>;
}

const EMPTY_STATE: CollegeListState = { entries: {} };
const STORAGE_KEY = "collegescout:college-list";
const SCHEMA_VERSION = 1;
const OLD_SAVED_KEY = "pathfinder-admit:saved-colleges";

function migrate(raw: unknown): CollegeListState {
  const parsed = raw as Partial<CollegeListState> | undefined;
  if (parsed && typeof parsed === "object" && parsed.entries) {
    return { entries: { ...parsed.entries } };
  }
  return { entries: {} };
}

const store = createLocalStore<CollegeListState>(STORAGE_KEY, EMPTY_STATE, SCHEMA_VERSION, migrate);

let legacyChecked = false;
/** One-time import of the old plain "saved college ids" set as Saved entries, so nobody's list disappears. */
function withLegacyMigration(): CollegeListState {
  const current = store.get();
  if (!legacyChecked && typeof window !== "undefined") {
    legacyChecked = true;
    const hasOwnData = window.localStorage.getItem(STORAGE_KEY);
    if (!hasOwnData) {
      try {
        const raw = window.localStorage.getItem(OLD_SAVED_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (ids.length > 0) {
          const now = new Date().toISOString();
          const entries: Record<string, CollegeListEntry> = {};
          for (const id of ids) {
            entries[id] = { collegeId: id, status: "Saved", round: null, addedAt: now, updatedAt: now };
          }
          store.set({ entries });
          return store.get();
        }
      } catch {
        // ignore malformed/unavailable legacy storage
      }
    }
  }
  return current;
}

export function getCollegeList(): CollegeListState {
  return withLegacyMigration();
}

export function useCollegeList() {
  const [state, setState] = store.useStore();
  return { state: legacyChecked ? state : (withLegacyMigration(), state), setState };
}

export function getEntry(collegeId: string): CollegeListEntry | undefined {
  return getCollegeList().entries[collegeId];
}

export function isSaved(collegeId: string): boolean {
  return getEntry(collegeId) !== undefined;
}

/** Adds a school as Saved if it isn't already on the list. Never creates tasks by itself. */
export function saveSchool(collegeId: string) {
  store.set((prev) => {
    if (prev.entries[collegeId]) return prev;
    const now = new Date().toISOString();
    return {
      entries: { ...prev.entries, [collegeId]: { collegeId, status: "Saved", round: null, addedAt: now, updatedAt: now } },
    };
  });
}

/** Removes a school from the list entirely (only meaningful while it's still just Saved). */
export function removeSchool(collegeId: string) {
  store.set((prev) => {
    const next = { ...prev.entries };
    delete next[collegeId];
    return { entries: next };
  });
}

export function toggleSaved(collegeId: string) {
  if (isSaved(collegeId)) removeSchool(collegeId);
  else saveSchool(collegeId);
}

/**
 * Moves a school to Applying (adding it to the list first if it wasn't saved) with the chosen
 * round. `round` is null for "Round not selected" — shown when the school's admissions page
 * doesn't have a round we've verified yet, rather than guessing one.
 */
export function addToApplications(collegeId: string, round: ApplicationRound | null) {
  store.set((prev) => {
    const now = new Date().toISOString();
    const existing = prev.entries[collegeId];
    return {
      entries: {
        ...prev.entries,
        [collegeId]: {
          collegeId,
          status: "Applying",
          round,
          addedAt: existing?.addedAt ?? now,
          updatedAt: now,
        },
      },
    };
  });
}

export function setStatus(collegeId: string, status: SchoolStatus) {
  store.set((prev) => {
    const existing = prev.entries[collegeId];
    const now = new Date().toISOString();
    if (!existing) {
      return { entries: { ...prev.entries, [collegeId]: { collegeId, status, round: null, addedAt: now, updatedAt: now } } };
    }
    return { entries: { ...prev.entries, [collegeId]: { ...existing, status, updatedAt: now } } };
  });
}

/** Wipes the saved/applying college list, in this browser only. Part of "Reset my data." */
export function resetCollegeList() {
  store.reset();
}

export function collegeListWasCorrupted(): boolean {
  return store.wasCorrupted();
}

export function setRound(collegeId: string, round: ApplicationRound | null) {
  store.set((prev) => {
    const existing = prev.entries[collegeId];
    if (!existing) return prev;
    return { entries: { ...prev.entries, [collegeId]: { ...existing, round, updatedAt: new Date().toISOString() } } };
  });
}

export function listEntries(state: CollegeListState): CollegeListEntry[] {
  return Object.values(state.entries);
}

export function entriesWithStatusAtLeast(state: CollegeListState, status: SchoolStatus): CollegeListEntry[] {
  const minRank = STATUS_ORDER.indexOf(status);
  return listEntries(state).filter((e) => STATUS_ORDER.indexOf(e.status) >= minRank);
}
