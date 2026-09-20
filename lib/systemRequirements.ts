import raw from "@/data/system-requirements.json";
import type { CollegeSystem } from "./types";

/**
 * Admission rules that are the same for every campus of a system (CSU and UC),
 * quoted from the system's own pages. See scripts/check-system-requirements.mjs,
 * which verifies each line against the live page. `source` values are keys of
 * `sources`. A line is either a plain string (using its section's source) or an
 * object with its own source.
 */
export type SystemLine = string | { text: string; source: string };

export type SystemSection =
  | { kind: "lines"; title: string; open?: boolean; source?: string; lines: SystemLine[] }
  | {
      kind: "steps";
      title: string;
      open?: boolean;
      source: string;
      intro: string;
      steps: { title: string; lines: string[] }[];
      labeled?: { source: string; lines: string[]; labels: string[] };
    }
  | { kind: "bullets"; title: string; open?: boolean; source: string; intro: string; items: string[] }
  | { kind: "courses"; title: string; open?: boolean };

export interface SystemRequirements {
  title: string;
  appliesTo: string;
  /** ISO date the pages were read. */
  checked: string;
  pageNote: string;
  sources: Record<string, string>;
  tiles: { value: string; label: string }[];
  courseRule: { source: string; text: string };
  courses: { area: string; subject: string; years: number; text: string; source?: string }[];
  sections: SystemSection[];
  /** Short plain-language rows for the admission overview; `evidence` is the exact page line each one rests on. */
  overview: { label: string; text: string; source: string; evidence: string }[];
  links: { label: string; url: string }[];
}

const systems = (raw as unknown as { systems: Record<string, SystemRequirements> }).systems;

export function getSystemRequirements(system: CollegeSystem): SystemRequirements | null {
  return systems[system] ?? null;
}

export function lineText(line: SystemLine): string {
  return typeof line === "string" ? line : line.text;
}
