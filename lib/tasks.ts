import type { College, Grade } from "./types";
import { checklistData } from "./checklistData";
import { getCommonAppFacts } from "./commonapp";
import { CURRENT_ESSAY_CYCLE, getApplicationInfo } from "./applications";
import type { ApplicationRound, CollegeListEntry } from "./collegeList";
import { ROUND_LABELS } from "./collegeList";
import { createLocalStore } from "./store";

export interface PlanTask {
  id: string;
  label: string;
  link?: { label: string; url: string };
  /** True for a task the student typed in themselves — shows a delete control; generated tasks don't. */
  isCustom?: boolean;
}

export interface PlanCategory {
  id: string;
  title: string;
  icon: string;
  tasks: PlanTask[];
}

export interface ApplicationTaskGroup {
  collegeId: string;
  collegeName: string;
  status: CollegeListEntry["status"];
  round: ApplicationRound | null;
  tasks: PlanTask[];
}

/** Extra plan tasks for a field of interest, on top of the grade-based checklist. Not sourced from any
 *  school (this is general college-prep advice, the same kind already in lib/checklistData.ts), so no
 *  citation is attached — only school-specific facts need one. */
const INTEREST_PLAN_EXTRAS: Record<string, (grade: Grade) => PlanTask[]> = {
  engineering: (grade) => {
    const tasks: PlanTask[] = [];
    if (grade <= 10) tasks.push({ id: `interest:engineering:${grade}:math`, label: "Stay on a math track that reaches Calculus by senior year" });
    if (grade >= 11) tasks.push({ id: `interest:engineering:${grade}:calc-physics`, label: "Confirm you're on track to complete Calculus and Physics by the end of senior year — most engineering programs expect both" });
    return tasks;
  },
  "cs-ai": (grade) => [
    { id: `interest:cs-ai:${grade}:course`, label: grade <= 10 ? "Take an introductory computer science or programming course if your school offers one" : "Consider an AP Computer Science course, and start a small personal coding project to show real work" },
  ],
  "music-performing": (grade) => (grade >= 11 ? [{ id: `interest:music:${grade}:portfolio`, label: "Start preparing an audition recording or repertoire list — many programs require one with the application" }] : []),
  "visual-arts": (grade) => (grade >= 11 ? [{ id: `interest:visual-arts:${grade}:portfolio`, label: "Start building a portfolio of your work — many programs require 10-20 pieces submitted with the application" }] : []),
  "medicine-health": (grade) => (grade >= 11 ? [{ id: `interest:medicine:${grade}:volunteer`, label: "Log volunteer or shadowing hours in a healthcare setting; many pre-health programs look for this" }] : []),
};

/**
 * "Your high-school plan": the existing grade-by-grade checklist (academics, testing,
 * extracurriculars, research, financial-aid timing), plus a small number of extra tasks for
 * whichever fields of interest the student chose. General college-prep guidance, not tied to
 * any one school, so it carries no per-item source link the way application tasks do.
 */
export function buildPlanCategories(grade: Grade, interestFieldIds: string[]): PlanCategory[] {
  const base = checklistData[grade].map((c) => ({
    id: c.id,
    title: c.title,
    icon: c.icon,
    tasks: c.items.map((i) => ({ id: i.id, label: i.label })),
  }));
  const extras = interestFieldIds.flatMap((id) => INTEREST_PLAN_EXTRAS[id]?.(grade) ?? []);
  if (extras.length > 0) {
    base.push({ id: "interests", title: "Based on Your Interests", icon: "sparkles", tasks: extras });
  }
  const custom = getCustomTasks().plan.map(toPlanTask);
  base.push({ id: "custom", title: "Your Own Tasks", icon: "sparkles", tasks: custom });
  return base;
}

function officialLink(college: College, url: string | undefined, label: string): { label: string; url: string } | undefined {
  if (url) return { label, url };
  if (college.website) return { label: `${college.name}'s website`, url: college.website };
  return undefined;
}

/** "Label (https://url)" -> the url, same shape provenance sources are stored in across this codebase. */
function sourceUrl(source: string | undefined): string | undefined {
  const m = /\((https?:\/\/[^)]+)\)$/.exec(source ?? "");
  return m ? m[1] : undefined;
}

/**
 * "Your applications": one task group per school with status Applying or later. Every task with a
 * concrete date or requirement is backed by a link to the official page it came from; where we
 * don't have one, the task is a prompt to go confirm it on the school's own site — never a guessed
 * date. See CollegeProfileDashboard/ApplicationRequirements for the same rule applied to essays.
 */
export function buildApplicationTasks(college: College, entry: CollegeListEntry): ApplicationTaskGroup {
  const tasks: PlanTask[] = [];
  const roundLabel = entry.round ? ROUND_LABELS[entry.round] : null;

  // Deadline
  const matchingPlan = entry.round ? college.applicationPlans.find((p) => p.type === entry.round) : undefined;
  const deadlineSourceUrl = sourceUrl(college.applicationPlansProvenance?.source);
  if (matchingPlan?.deadline && deadlineSourceUrl) {
    tasks.push({
      id: `app:${college.id}:deadline`,
      label: `Submit your application by ${matchingPlan.deadline}${roundLabel ? ` (${roundLabel})` : ""}`,
      link: officialLink(college, deadlineSourceUrl, `${college.name}'s deadline page`),
    });
  } else {
    tasks.push({
      id: `app:${college.id}:deadline`,
      label: `Confirm the${roundLabel ? ` ${roundLabel}` : ""} deadline on ${college.name}'s admissions page`,
      link: officialLink(college, deadlineSourceUrl, `${college.name}'s admissions page`),
    });
  }

  // Testing
  const testingSourceUrl = sourceUrl(college.testingPolicyProvenance?.source);
  if (college.testingPolicy !== "Not verified") {
    const testingText =
      college.testingPolicy === "Test-Required"
        ? "Submit SAT or ACT scores (required)"
        : college.testingPolicy === "Test-Optional"
          ? "Decide whether to submit SAT/ACT scores (optional here)"
          : "No SAT/ACT scores needed — this school doesn't consider them";
    tasks.push({ id: `app:${college.id}:testing`, label: testingText, link: officialLink(college, testingSourceUrl, `${college.name}'s testing policy`) });
  } else {
    tasks.push({
      id: `app:${college.id}:testing`,
      label: `Confirm the testing requirement on ${college.name}'s admissions page`,
      link: officialLink(college, undefined, `${college.name}'s admissions page`),
    });
  }

  // Essays and supplements
  const appInfo = getApplicationInfo(college.id);
  if (appInfo?.verifiedForCycle === CURRENT_ESSAY_CYCLE) {
    tasks.push({
      id: `app:${college.id}:essays`,
      label: `Write ${college.name}'s essays and supplements (${CURRENT_ESSAY_CYCLE})`,
      link: officialLink(college, appInfo.essayPageUrl, `${college.name}'s essay prompts`),
    });
  } else {
    tasks.push({
      id: `app:${college.id}:essays`,
      label: `Confirm this cycle's essay prompts on ${college.name}'s admissions page`,
      link: officialLink(college, undefined, `${college.name}'s admissions page`),
    });
  }

  // Recommendations
  const facts = getCommonAppFacts(college.id);
  const recCount = facts?.teacherEvaluations;
  if (recCount || facts?.counselorRecommendation) {
    const parts: string[] = [];
    if (recCount) parts.push(`${recCount} teacher recommendation${recCount === 1 ? "" : "s"}`);
    if (facts?.counselorRecommendation) parts.push("a counselor recommendation");
    tasks.push({
      id: `app:${college.id}:recs`,
      label: `Request ${parts.join(" and ")}`,
      link: officialLink(college, undefined, `${college.name}'s admissions page`),
    });
  } else {
    tasks.push({
      id: `app:${college.id}:recs`,
      label: `Confirm recommendation requirements on ${college.name}'s admissions page`,
      link: officialLink(college, undefined, `${college.name}'s admissions page`),
    });
  }

  // Financial aid timing — FAFSA's opening date is a fixed federal date, not a per-school fact.
  tasks.push({
    id: `app:${college.id}:fafsa`,
    label: `File the FAFSA (opens October 1) — check whether ${college.name} also requires the CSS Profile`,
    link: { label: "FAFSA at studentaid.gov", url: "https://studentaid.gov/h/apply-for-aid/fafsa" },
  });

  // Portfolio or audition, only when the school's own Common App data says it collects one.
  if (facts?.portfolio) {
    tasks.push({
      id: `app:${college.id}:portfolio`,
      label: `Prepare your portfolio (collected through ${facts.portfolio})`,
      link: officialLink(college, undefined, `${college.name}'s admissions page`),
    });
  }

  const custom = (getCustomTasks().byCollege[college.id] ?? []).map(toPlanTask);
  tasks.push(...custom);

  return { collegeId: college.id, collegeName: college.name, status: entry.status, round: entry.round, tasks };
}

// --- Custom, student-created tasks: the one piece of the third shared record that isn't
// recomputed from the profile, since a task the student typed in themselves can't be derived
// from anything. Regenerating the plan/application task lists above never touches this store,
// so a custom task is never silently dropped the way a regenerated (derived) task could never
// silently duplicate — see buildPlanCategories/buildApplicationTasks, which only ever read it.
export interface CustomTask {
  id: string;
  label: string;
  link?: { label: string; url: string };
  createdAt: string;
}

interface CustomTasksState {
  plan: CustomTask[];
  byCollege: Record<string, CustomTask[]>;
}

const EMPTY_CUSTOM_TASKS: CustomTasksState = { plan: [], byCollege: {} };
const customTasksStore = createLocalStore<CustomTasksState>("collegescout:custom-tasks", EMPTY_CUSTOM_TASKS, 1, (raw) => {
  const parsed = raw as Partial<CustomTasksState> | undefined;
  return { plan: parsed?.plan ?? [], byCollege: parsed?.byCollege ?? {} };
});

function toPlanTask(t: CustomTask): PlanTask {
  return { id: `custom:${t.id}`, label: t.label, link: t.link, isCustom: true };
}

function getCustomTasks(): CustomTasksState {
  return customTasksStore.get();
}

export function useCustomTasks() {
  const [state] = customTasksStore.useStore();
  return state;
}

function newCustomTask(label: string): CustomTask {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label, createdAt: new Date().toISOString() };
}

/** Adds a task to "Your high-school plan," alongside the generated grade/interest tasks. */
export function addCustomPlanTask(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return;
  customTasksStore.set((prev) => ({ ...prev, plan: [...prev.plan, newCustomTask(trimmed)] }));
}

/** Adds a task to one school's application task group, alongside its generated ones. */
export function addCustomApplicationTask(collegeId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return;
  customTasksStore.set((prev) => ({
    ...prev,
    byCollege: { ...prev.byCollege, [collegeId]: [...(prev.byCollege[collegeId] ?? []), newCustomTask(trimmed)] },
  }));
}

/** Removes a custom task the student added — the only way one of these ever disappears. `rawId` is the id without the "custom:" prefix buildPlanCategories/buildApplicationTasks add. */
export function removeCustomTask(rawId: string, collegeId?: string) {
  customTasksStore.set((prev) => {
    if (collegeId) {
      return { ...prev, byCollege: { ...prev.byCollege, [collegeId]: (prev.byCollege[collegeId] ?? []).filter((t) => t.id !== rawId) } };
    }
    return { ...prev, plan: prev.plan.filter((t) => t.id !== rawId) };
  });
}

// --- Task completion, the third shared record. The task list itself is always recomputed live
// from the profile + college list + college data above; only which task ids are checked off is
// persisted, the same pattern the old checklist used (see app/checklist/page.tsx history).
interface TaskProgressState {
  done: Record<string, boolean>;
}
const taskProgressStore = createLocalStore<TaskProgressState>("collegescout:task-progress", { done: {} }, 1);
const OLD_CHECKLIST_KEY = "pathfinder-admit:checklist-progress";

let legacyChecked = false;
function withLegacyMigration(): TaskProgressState {
  const current = taskProgressStore.get();
  if (!legacyChecked && typeof window !== "undefined") {
    legacyChecked = true;
    const hasOwnData = window.localStorage.getItem("collegescout:task-progress");
    if (!hasOwnData) {
      try {
        const raw = window.localStorage.getItem(OLD_CHECKLIST_KEY);
        const old: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        if (Object.keys(old).length > 0) {
          taskProgressStore.set({ done: old });
          return taskProgressStore.get();
        }
      } catch {
        // ignore malformed/unavailable legacy storage
      }
    }
  }
  return current;
}

export function useTaskProgress() {
  const [state] = taskProgressStore.useStore();
  const done = (legacyChecked ? state : withLegacyMigration()).done;
  return { done };
}

export function toggleTaskDone(id: string) {
  withLegacyMigration();
  taskProgressStore.set((prev) => ({ done: { ...prev.done, [id]: !prev.done[id] } }));
}

/** Wipes checked-off progress. Custom tasks themselves are a separate store — see resetCustomTasks — since "Reset my data" clearing progress shouldn't be the only way to remove a task someone typed in. */
export function resetTaskProgress() {
  taskProgressStore.reset();
}

/** Wipes every student-created task, in this browser only. Part of "Reset my data." */
export function resetCustomTasks() {
  customTasksStore.reset();
}

export function taskProgressWasCorrupted(): boolean {
  return taskProgressStore.wasCorrupted() || customTasksStore.wasCorrupted();
}

/** Total not-yet-checked-off tasks across both My Plan sections — what the nav "My Plan · N tasks" counter shows. */
export function countOpenTasks(planCategories: PlanCategory[], applicationGroups: ApplicationTaskGroup[], done: Record<string, boolean>): number {
  const ids = [...planCategories.flatMap((c) => c.tasks.map((t) => t.id)), ...applicationGroups.flatMap((g) => g.tasks.map((t) => t.id))];
  return ids.filter((id) => !done[id]).length;
}
