"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CalendarClock, ExternalLink } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import SaveSummerProgramButton from "@/components/SaveSummerProgramButton";
import { summerPrograms } from "@/data/summerPrograms";
import { scholarships } from "@/lib/scholarships";
import { formatSummerDate, matchesGrade } from "@/lib/summer";

interface DueItem {
  key: string;
  kind: "Scholarship" | "Summer program";
  name: string;
  host: string;
  date: string;
  /** Regional limit worth seeing before opening it, e.g. a county. */
  note?: string;
  matchesGrade: (grade: number) => boolean;
  scholarshipQuery?: string;
  summerId?: string;
  url?: string;
}

// Only programs with one posted date can be on a calendar; blank deadlines stay on their own pages.
const ITEMS: DueItem[] = [
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
            scholarshipQuery: s.name,
          },
        ]
      : []
  ),
  ...summerPrograms.flatMap((p): DueItem[] =>
    p.deadline
      ? [
          {
            key: `summer:${p.id}`,
            kind: "Summer program",
            name: p.name,
            host: p.host,
            date: p.deadline,
            matchesGrade: (grade) => matchesGrade(p, grade as 9 | 10 | 11 | 12),
            summerId: p.id,
            url: p.officialUrl,
          },
        ]
      : []
  ),
];

const SOON_DAYS = 90;

function daysUntil(date: string, today: Date) {
  return Math.floor((new Date(`${date}T23:59:59`).getTime() - today.getTime()) / 86_400_000);
}

function monthLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function DueRow({ item, today }: { item: DueItem; today: Date }) {
  const days = daysUntil(item.date, today);
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-navy-900">
          {formatSummerDate(item.date)}
          <span className={clsx("ml-2 font-semibold", days <= 14 ? "text-gold-700" : "text-slate-500")}>
            {days === 0 ? "due today" : `${days} ${days === 1 ? "day" : "days"} left`}
          </span>
        </p>
        <p className="mt-1 text-base font-bold leading-snug text-navy-900">{item.name}</p>
        <p className="text-sm text-slate-500">
          {item.host} &middot; {item.kind}
          {item.note && ` · ${item.note}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {item.summerId && <SaveSummerProgramButton id={item.summerId} name={item.name} />}
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
            Official site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : (
          <Link href={`/scholarships?q=${encodeURIComponent(item.scholarshipQuery ?? item.name)}`} className="text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
            See details
          </Link>
        )}
      </div>
    </li>
  );
}

export default function DueSoonPage() {
  // The page is built once, so what counts as upcoming waits for the browser's date.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const [grade, setGrade] = useState("all");
  const [kind, setKind] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const upcoming = useMemo(() => {
    if (!today) return [];
    return ITEMS.filter((item) => daysUntil(item.date, today) >= 0)
      .filter((item) => grade === "all" || item.matchesGrade(Number(grade)))
      .filter((item) => kind === "all" || item.kind === kind)
      .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  }, [today, grade, kind]);

  const shown = showAll || !today ? upcoming : upcoming.filter((item) => daysUntil(item.date, today) <= SOON_DAYS);
  const months = Array.from(new Set(shown.map((item) => monthLabel(item.date))));

  return (
    <div className="max-w-4xl space-y-6">
      <SectionHeader icon={CalendarClock} label="Scholarships and summer programs" title="Due Soon">
        <p>Upcoming deadlines from Scholarships and Summer Opportunities in one list, soonest first.</p>
      </SectionHeader>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        {(
          [
            ["Your grade now", grade, setGrade, [["9", "9th"], ["10", "10th"], ["11", "11th"], ["12", "12th"]]],
            ["Type", kind, setKind, [["Scholarship", "Scholarships"], ["Summer program", "Summer programs"]]],
          ] as const
        ).map(([label, value, onChange, options]) => (
          <label key={label} className="block text-sm font-semibold text-slate-600">
            {label}
            <select
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="mt-1 w-full rounded-full border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-normal text-navy-900 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="all">All</option>
              {options.map(([optionValue, optionLabel]) => (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {today && shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">Nothing is due in the next {SOON_DAYS} days for these choices.</div>
      )}

      {today &&
        months.map((month) => (
          <section key={month}>
            <h2 className="text-lg font-bold text-navy-900">{month}</h2>
            <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              {shown
                .filter((item) => monthLabel(item.date) === month)
                .map((item) => (
                  <DueRow key={item.key} item={item} today={today} />
                ))}
            </ul>
          </section>
        ))}

      {today && !showAll && upcoming.length > shown.length && (
        <button type="button" onClick={() => setShowAll(true)} className="text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
          Show {upcoming.length - shown.length} later {upcoming.length - shown.length === 1 ? "deadline" : "deadlines"}
        </button>
      )}
    </div>
  );
}
