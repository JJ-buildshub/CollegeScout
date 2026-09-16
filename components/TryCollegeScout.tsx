"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { colleges, formatPercent } from "@/lib/colleges";
import { DEFAULT_INTEREST_IDS, INTEREST_TAXONOMY, getPathwayLabel, matchesInterest } from "@/lib/interests";
import SystemBadge from "./SystemBadge";

const NOT_SURE_ID = "not-sure";
const MAX_RESULTS = 6;
const LOW_MATCH_THRESHOLD = 3;

const DEFAULT_INTERESTS = INTEREST_TAXONOMY.filter((i) => DEFAULT_INTEREST_IDS.includes(i.id));
const OVERFLOW_INTERESTS = INTEREST_TAXONOMY.filter((i) => !DEFAULT_INTEREST_IDS.includes(i.id));

export default function TryCollegeScout() {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_INTEREST_IDS[0]);
  const [showMore, setShowMore] = useState(false);

  const isNotSure = selectedId === NOT_SURE_ID;
  const selectedInterest = INTEREST_TAXONOMY.find((i) => i.id === selectedId);

  const matches = useMemo(() => {
    if (isNotSure || !selectedInterest) return [];
    return colleges
      .filter((c) => matchesInterest(c, selectedInterest.id))
      .sort((a, b) => a.rank - b.rank);
  }, [selectedInterest, isNotSure]);

  const results = matches.slice(0, MAX_RESULTS).map((college) => ({
    college,
    pathway: getPathwayLabel(college, selectedId) ?? college.careerMajorTags.primaryDisciplines[0] ?? "",
  }));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 pb-6 pt-8 shadow-card sm:px-10 sm:pb-10 sm:pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
          What are you interested in?
        </h2>
      </div>

      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {DEFAULT_INTERESTS.map((interest) => (
          <button
            key={interest.id}
            type="button"
            onClick={() => setSelectedId(interest.id)}
            className={clsx(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              selectedId === interest.id
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {interest.label}
          </button>
        ))}

        {showMore &&
          OVERFLOW_INTERESTS.map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => setSelectedId(interest.id)}
              className={clsx(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                selectedId === interest.id
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {interest.label}
            </button>
          ))}

        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-500 hover:border-slate-400"
          >
            Show {OVERFLOW_INTERESTS.length} more
          </button>
        )}

        <button
          type="button"
          onClick={() => setSelectedId(NOT_SURE_ID)}
          className={clsx(
            "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            isNotSure
              ? "border-navy-900 bg-navy-900 text-white"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          )}
        >
          I&apos;m not sure yet
        </button>
      </div>

      {isNotSure ? (
        <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">
            Totally fine &mdash; most students don&apos;t know yet. Browse all {colleges.length}{" "}
            schools, or see what different paths can lead to.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Browse the Directory <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#career-outcomes"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy-900 hover:border-slate-300"
            >
              See Career Outcomes
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ college, pathway }) => (
              <Link
                key={college.id}
                href={`/directory/${college.id}`}
                className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <SystemBadge system={college.system} className="self-start" />
                <h3 className="mt-3 text-sm font-bold leading-snug text-navy-900">{college.name}</h3>
                <p className="mt-2 text-xs font-semibold text-gold-600">{pathway}</p>
                <p className="mt-2 flex-1 text-xs text-slate-500">
                  A dedicated program built specifically around {selectedInterest?.label.toLowerCase()}.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {formatPercent(college.admitRateOverall)} overall admit
                </p>
                <span className="mt-2 text-xs font-semibold text-navy-900">View School &rarr;</span>
              </Link>
            ))}
          </div>

          {matches.length > 0 && matches.length < LOW_MATCH_THRESHOLD && (
            <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-400">
              Only {matches.length} school{matches.length === 1 ? "" : "s"} in this dataset{" "}
              {matches.length === 1 ? "has" : "have"} a clearly tagged {selectedInterest?.label} pathway
              &mdash; that doesn&apos;t mean other schools don&apos;t offer it. Try a related interest or
              browse everything.
            </p>
          )}

          <p className="mx-auto mt-6 max-w-xl text-center text-xs text-slate-400">
            These are examples of how each program is structured &mdash; not a ranking or a
            recommendation. Every interest above can be explored the same way.
          </p>

          <div className="mt-6 text-center">
            <Link
              href={`/directory?interest=${selectedId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:border-slate-300"
            >
              See all matching programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
