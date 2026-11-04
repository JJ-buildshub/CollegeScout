"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { daysUntil, upcoming, type DueItem } from "@/lib/dueSoon";
import { formatSummerDate } from "@/lib/summer";

const SHOWN = 3;

/** The next few scholarship and program deadlines, so the homepage shows what's due rather than describing it. */
export default function HomeDueSoon() {
  // The page is built once, so what's still upcoming waits for the browser's date.
  const [items, setItems] = useState<{ item: DueItem; days: number }[] | null>(null);
  useEffect(() => {
    const today = new Date();
    setItems(upcoming(today).slice(0, SHOWN).map((item) => ({ item, days: daysUntil(item.date, today) })));
  }, []);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-card sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">Scholarship, internship and program deadlines</h2>
        <Link href="/due-soon" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
          See every deadline <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-5 divide-y divide-slate-100">
        {(items ?? []).map(({ item, days }) => (
          <li key={item.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-navy-900 hover:text-gold-600">
                  {item.name}
                </a>
              ) : (
                <Link href={item.href} className="text-base font-bold text-navy-900 hover:text-gold-600">
                  {item.name}
                </Link>
              )}
              <p className="text-sm text-slate-500">
                {item.kind} &middot; {item.host}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-navy-900">
              {formatSummerDate(item.date)}
              <span className="ml-2 text-slate-500">{days === 0 ? "due today" : `${days} ${days === 1 ? "day" : "days"} left`}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
