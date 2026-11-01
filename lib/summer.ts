import { summerPrograms, type SummerGrade, type SummerInterest, type SummerProgram } from "@/data/summerPrograms";
import { getInterestById } from "./interests";

export type SummerPlace = "bay-area" | "online" | "travel";

/** Tags the site's interest taxonomy has no match for; every other tag reads its label from there. */
const EXTRA_INTEREST_LABELS: Partial<Record<SummerInterest, string>> = {
  research: "Research",
  math: "Math",
  "many-subjects": "Many subjects",
};

export function summerInterestLabel(id: SummerInterest): string {
  return EXTRA_INTEREST_LABELS[id] ?? getInterestById(id)?.label ?? id;
}

/** Only the interests some program actually has, so no filter option comes up empty on its own. */
export const summerInterests: SummerInterest[] = Array.from(new Set(summerPrograms.flatMap((p) => p.interests))).sort((a, b) =>
  summerInterestLabel(a).localeCompare(summerInterestLabel(b))
);

export function getSummerProgram(id: string): SummerProgram | undefined {
  return summerPrograms.find((p) => p.id === id);
}

export function isBayArea(program: SummerProgram): boolean {
  return program.format.some((f) => f.kind === "bay-area");
}

export function matchesPlace(program: SummerProgram, place: SummerPlace): boolean {
  if (place === "bay-area") return isBayArea(program);
  if (place === "online") return program.format.some((f) => f.kind === "online");
  return program.format.some((f) => f.kind === "in-person");
}

/** A program whose official page doesn't state grades stays in every grade's list, rather than being hidden on a guess. */
export function matchesGrade(program: SummerProgram, grade: SummerGrade): boolean {
  return program.eligibility.grades === null || program.eligibility.grades.includes(grade);
}

export function formatSummerDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export type SummerSort = "deadline-soonest" | "deadline-latest" | "start-soonest";

/** Soonest deadline first (or latest, when `latest` is set), then passed deadlines, with blank deadlines last. */
export function byDeadline(today: Date | null, latest = false) {
  const passed = (p: SummerProgram) => (today && p.deadline && new Date(`${p.deadline}T23:59:59`) < today ? 1 : 0);
  return (a: SummerProgram, b: SummerProgram) => {
    if (!a.deadline || !b.deadline) return (a.deadline ? 0 : 1) - (b.deadline ? 0 : 1) || a.name.localeCompare(b.name);
    const order = latest ? b.deadline.localeCompare(a.deadline) : a.deadline.localeCompare(b.deadline);
    return passed(a) - passed(b) || order || a.name.localeCompare(b.name);
  };
}

/** Earliest program start first, with programs that have no posted start last. */
function byStartDate(a: SummerProgram, b: SummerProgram) {
  if (!a.startDate || !b.startDate) return (a.startDate ? 0 : 1) - (b.startDate ? 0 : 1) || a.name.localeCompare(b.name);
  return a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name);
}

export function summerComparator(sort: SummerSort, today: Date | null) {
  return sort === "start-soonest" ? byStartDate : byDeadline(today, sort === "deadline-latest");
}
