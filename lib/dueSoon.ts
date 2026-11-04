import { summerPrograms } from "@/data/summerPrograms";
import { scholarships } from "./scholarships";
import { matchesGrade } from "./summer";

export interface DueItem {
  key: string;
  kind: "Scholarship" | "Internship or program";
  name: string;
  host: string;
  date: string;
  /** Regional limit worth seeing before opening it, e.g. a county. */
  note?: string;
  matchesGrade: (grade: number) => boolean;
  /** What the save button saves: a scholarship id or a summer program id. */
  save: { kind: "scholarship" | "summer"; id: string };
  href: string;
  external: boolean;
}

// Only programs with one posted date can be on a calendar; blank deadlines stay on their own pages.
export const DUE_ITEMS: DueItem[] = [
  ...scholarships.flatMap((s): DueItem[] =>
    s.closes
      ? [
          {
            key: `scholarship:${s.id}`,
            kind: "Scholarship",
            name: s.name,
            host: s.runBy,
            date: s.closes,
            note: s.area ?? s.only,
            matchesGrade: (grade) => (s.grades as number[]).includes(grade),
            save: { kind: "scholarship", id: s.id },
            href: `/scholarships?q=${encodeURIComponent(s.name)}`,
            external: false,
          },
        ]
      : []
  ),
  ...summerPrograms.flatMap((p): DueItem[] =>
    p.deadline
      ? [
          {
            key: `summer:${p.id}`,
            kind: "Internship or program",
            name: p.name,
            host: p.host,
            date: p.deadline,
            matchesGrade: (grade) => matchesGrade(p, grade as 9 | 10 | 11 | 12),
            save: { kind: "summer", id: p.id },
            href: p.officialUrl,
            external: true,
          },
        ]
      : []
  ),
];

export function daysUntil(date: string, today: Date) {
  return Math.floor((new Date(`${date}T23:59:59`).getTime() - today.getTime()) / 86_400_000);
}

/** Still open on `today`, soonest first. */
export function upcoming(today: Date): DueItem[] {
  return DUE_ITEMS.filter((item) => daysUntil(item.date, today) >= 0).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

