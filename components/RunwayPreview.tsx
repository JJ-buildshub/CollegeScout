"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { checklistData } from "@/lib/checklistData";

export default function RunwayPreview() {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pathfinder-admit:checklist-progress");
      const progress = raw ? JSON.parse(raw) : {};
      const allIds = ([9, 10, 11, 12] as const).flatMap((g) =>
        checklistData[g].flatMap((c) => c.items.map((i) => i.id))
      );
      setTotal(allIds.length);
      setDone(allIds.filter((id) => progress[id]).length);
    } catch {
      // ignore malformed/unavailable storage
    }
    setMounted(true);
  }, []);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <ListChecks className="h-5 w-5 text-navy-900" />
      <h2 className="mt-3 text-lg font-bold text-navy-900">Know what comes next.</h2>
      <p className="mt-2 flex-1 text-sm text-slate-500">
        Applications, essays, testing, recommendations, financial aid, and scholarships &mdash;
        tracked by grade, from 9th grade through decision day.
      </p>
      <p className="mt-3 text-xs font-semibold text-gold-600">
        {mounted ? (total > 0 ? `${done} of ${total} milestones complete` : "Start your checklist") : "Grade-by-grade checklists"}
      </p>
      <Link
        href="/checklist"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-navy-700"
      >
        View My Runway <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
