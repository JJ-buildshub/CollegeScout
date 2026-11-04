"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { PlanTabs } from "@/components/SectionTabs";
import PageHeader from "@/components/PageHeader";
import SaveToPlanButton from "@/components/SaveToPlanButton";
import { daysUntil, upcoming as upcomingItems, type DueItem } from "@/lib/dueSoon";
import { formatSummerDate } from "@/lib/summer";

const SOON_DAYS = 90;


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
        <SaveToPlanButton kind={item.save.kind} id={item.save.id} name={item.name} />
        {item.external ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
            Official site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : (
          <Link href={item.href} className="text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
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
    return upcomingItems(today)
      .filter((item) => grade === "all" || item.matchesGrade(Number(grade)))
      .filter((item) => kind === "all" || item.kind === kind);
  }, [today, grade, kind]);

  const shown = showAll || !today ? upcoming : upcoming.filter((item) => daysUntil(item.date, today) <= SOON_DAYS);
  const months = Array.from(new Set(shown.map((item) => monthLabel(item.date))));

  return (
    <div className="max-w-4xl space-y-6">
      <PlanTabs />
      <PageHeader eyebrow="Your work" title="Scholarship, Internship & Program Deadlines">
        <p>Every application with a posted date that hasn&apos;t passed yet, soonest first.</p>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        {(
          [
            ["Your grade now", grade, setGrade, [["9", "9th"], ["10", "10th"], ["11", "11th"], ["12", "12th"]]],
            ["Type", kind, setKind, [["Scholarship", "Scholarships"], ["Internship or program", "Internships & programs"]]],
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
