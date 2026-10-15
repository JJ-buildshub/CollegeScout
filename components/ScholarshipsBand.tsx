"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The homepage's pointer to /scholarships. It takes only the deadlines, not the
 * scholarship records: the full data file is several hundred KB and the
 * homepage needs one number from it. "Due in the next 60 days" depends on
 * today's date, so it is counted in the browser after mount; the build-time
 * HTML shows the total instead. Programs with no single national date (set by a
 * local club or a state) are left out of that count rather than guessed at.
 */
export default function ScholarshipsBand({ total, closes }: { total: number; closes: (string | null)[] }) {
  const [dueSoon, setDueSoon] = useState<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const horizon = now + 60 * 86_400_000;
    setDueSoon(
      closes.filter((date) => {
        if (!date) return false;
        const end = new Date(`${date}T23:59:59`).getTime();
        return end >= now && end <= horizon;
      }).length
    );
  }, [closes]);

  return (
    <section className="rounded-3xl bg-navy-900 p-6 text-white sm:p-10">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Scholarships</p>
          <h2 className="mt-2 font-display text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Most students hear about scholarships senior year.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            By then, several of the biggest deadlines have passed. Some of these start in 9th grade, and every one is
            checked on the organization&apos;s own site.
          </p>
        </div>
        <div className="lg:text-right">
          <p className="text-sm font-semibold text-gold-400">
            {dueSoon
              ? `${dueSoon} deadlines in the next 60 days`
              : `${total} scholarships and awards, from 9th grade on`}
          </p>
          <Link
            href="/scholarships"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-300"
          >
            See what you can start on now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
