import raw from "@/data/system-requirements.json";
import type { CollegeSystem } from "./types";

/**
 * Admission rules that are the same for every campus of a system (today: CSU),
 * quoted from the system's own pages. See scripts/check-system-requirements.mjs,
 * which verifies each line against the live page.
 */
export interface SystemRequirements {
  title: string;
  appliesTo: string;
  /** ISO date the pages were read. */
  checked: string;
  pageNote: string;
  sources: { main: string; testing: string; calculator: string };
  courseRule: { text: string };
  courses: { area: string; subject: string; years: number; text: string }[];
  gpa: { lines: string[] };
  supplementalFactors: { intro: string; items: string[] };
  honors: { lines: string[]; labels: string[] };
  graduation: { lines: string[] };
  residency: { text: string };
  testing: { text: string };
  gpaMethod: { intro: string; steps: { title: string; lines: string[] }[] };
  links: { label: string; url: string }[];
}

const systems = (raw as unknown as { systems: Record<string, SystemRequirements> }).systems;

export function getSystemRequirements(system: CollegeSystem): SystemRequirements | null {
  return systems[system] ?? null;
}
