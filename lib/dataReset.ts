"use client";

/**
 * Combines every shared store's own reset/corruption check into one place for
 * the "Reset my data" control and a corrupted-data banner. Deliberately not
 * part of lib/store.ts itself: that module is the generic, dependency-free
 * primitive every store is built from, and importing lib/profile.ts,
 * lib/collegeList.ts and lib/tasks.ts back into it would be circular. Each
 * reset call goes through that store's own `.reset()`, not a raw
 * localStorage.removeItem — clearing storage directly would leave a store's
 * in-memory state (and every component subscribed to it) stale until reload.
 */
import { profileWasCorrupted, resetProfile } from "./profile";
import { collegeListWasCorrupted, resetCollegeList } from "./collegeList";
import { resetCustomTasks, resetTaskProgress, taskProgressWasCorrupted } from "./tasks";

/** Wipes the student profile, college list, and every generated/custom task's progress from this browser. Nothing else on the site is touched. */
export function resetAllCollegeScoutData() {
  resetProfile();
  resetCollegeList();
  resetTaskProgress();
  resetCustomTasks();
}

/** True if any shared store found unparseable JSON on load this session (see lib/store.ts). */
export function anyDataCorrupted(): boolean {
  return profileWasCorrupted() || collegeListWasCorrupted() || taskProgressWasCorrupted();
}
