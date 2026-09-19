import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCollegeById, displayedAdmitRate, formatPercent } from "@/lib/colleges";
import type { College } from "@/lib/types";
import SystemBadge from "./SystemBadge";

const EXAMPLE_INTEREST = "Data Science + Business";

const EXAMPLES: { id: string; pathway: string }[] = [
  { id: "university-of-southern-california", pathway: "BS Artificial Intelligence for Business" },
  { id: "university-of-illinois-urbana-champaign", pathway: "BS in Business + Data Science" },
  { id: "carnegie-mellon-university", pathway: "BS in Statistics & Machine Learning" },
  { id: "university-of-texas-at-austin", pathway: "Management Information Systems" },
  { id: "indiana-university-bloomington", pathway: "BS in Business Intelligence and Data Science" },
];

export default function DiscoveryExample() {
  const cards = EXAMPLES.map(({ id, pathway }) => {
    const college = getCollegeById(id);
    return college ? { college, pathway } : null;
  }).filter((c): c is { college: College; pathway: string } => c !== null);

  return (
    <section className="rounded-3xl bg-navy-900 px-6 py-14 text-white sm:px-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold-400">
          One interest. Many paths.
        </span>
        <p className="mt-4 text-sm text-slate-300 sm:text-base">
          CollegeScout helps you discover how different colleges turn the same interest into very
          different academic and career opportunities.
        </p>
      </div>

      <div className="mx-auto mt-4 text-center">
        <span className="inline-block rounded-full bg-gold-500/10 px-4 py-1.5 text-sm font-bold text-gold-400 ring-1 ring-inset ring-gold-500/30">
          Interest: {EXAMPLE_INTEREST}
        </span>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ college, pathway }) => (
          <Link
            key={college.id}
            href={`/directory/${college.id}`}
            className="flex flex-col rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <SystemBadge system={college.system} className="self-start" />
            <h3 className="mt-3 text-sm font-bold leading-snug text-white">{college.name}</h3>
            <p className="mt-2 flex-1 text-xs font-semibold text-gold-400">{pathway}</p>
            <p className="mt-3 text-xs text-slate-400">{formatPercent(displayedAdmitRate(college).value)} admit</p>
          </Link>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-400">
        This is a demonstration, not a recommendation for every student — every school on
        CollegeScout can be explored the same way for any interest of your own.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Explore colleges by interest <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
