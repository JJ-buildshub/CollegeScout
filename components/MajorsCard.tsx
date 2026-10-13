"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { getInterestById, normalizeInterestIds } from "@/lib/interests";
import { cipPrefixesFor } from "@/lib/programs";
import type { Major, SchoolMajors } from "@/lib/majors";

const TOP_COUNT = 10;
// Enough to show what kinds of, say, engineering a school teaches without the
// interest block outgrowing the top-ten list it sits above.
const MAX_INTEREST_MAJORS = 6;

interface Props {
  collegeName: string;
  majors: SchoolMajors;
}

/**
 * What students at this school actually major in, and — when the visitor came
 * here from an interest they picked — which of this school's majors fall in
 * that interest. Replaces the old "Impacted Majors" chips, which carried no
 * source. The interest arrives in the URL (?interests=engineering,nursing), so
 * it survives a refresh and a shared link.
 */
export default function MajorsCard(props: Props) {
  // useSearchParams needs a Suspense boundary on a statically rendered page;
  // the fallback is the same card without an interest, so nothing shifts.
  return (
    <Suspense fallback={<MajorsCardBody {...props} interestIds={[]} />}>
      <MajorsCardWithInterests {...props} />
    </Suspense>
  );
}

function MajorsCardWithInterests(props: Props) {
  const raw = useSearchParams().get("interests");
  const interestIds = raw ? normalizeInterestIds(raw.split(",").filter(Boolean)) : [];
  return <MajorsCardBody {...props} interestIds={interestIds} />;
}

function MajorsCardBody({ collegeName, majors, interestIds }: Props & { interestIds: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const { list } = majors;
  if (list.length === 0) return null;

  // Only interests tied to a field of study can be matched to a major; a few
  // (Games, Environment, Law & Policy) have no field yet and are left out.
  const interests = interestIds
    .map(getInterestById)
    .filter((i): i is NonNullable<typeof i> => !!i && !!i.programs)
    .map((interest) => {
      const prefixes = cipPrefixesFor(interest.programs ?? []);
      return { interest, majors: list.filter((m) => prefixes.some((p) => m.cip.startsWith(p))) };
    });
  const inAnInterest = new Set(interests.flatMap((i) => i.majors.map((m) => m.cip)));

  const visible = showAll ? list : list.slice(0, TOP_COUNT);

  return (
    <div className="w-full max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      {interests.map(({ interest, majors: matched }) => (
        <div key={interest.id} className="mb-5 border-b border-slate-100 pb-5">
          <div className="text-xs font-bold tracking-wide text-slate-600">
            Your interest: {interest.label}
          </div>
          {matched.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matched.slice(0, MAX_INTEREST_MAJORS).map((m) => (
                <MajorChip key={m.cip} major={m} highlighted />
              ))}
              {matched.length > MAX_INTEREST_MAJORS && (
                <span className="px-1 py-1 text-xs text-slate-500">
                  and {matched.length - MAX_INTEREST_MAJORS} more
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              {collegeName} did not report any {interest.label} majors for {majors.year}.
            </p>
          )}
        </div>
      ))}

      <div className="text-xs font-bold tracking-wide text-slate-600">
        {showAll ? "All majors" : list.length > TOP_COUNT ? `Top ${TOP_COUNT} majors` : "Majors"}
      </div>
      <ol className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {visible.map((m, i) => (
          <li key={m.cip} className="flex items-baseline gap-2 text-sm">
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">{i + 1}</span>
            <span className={clsx(inAnInterest.has(m.cip) ? "font-semibold text-navy-900" : "text-slate-700")}>
              {m.name}
            </span>
            {inAnInterest.has(m.cip) && (
              <span className="shrink-0 rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-navy-900">
                your interest
              </span>
            )}
          </li>
        ))}
      </ol>

      {list.length > TOP_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
        >
          {showAll ? `Show the top ${TOP_COUNT}` : `See all ${list.length} majors`}
        </button>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Ordered by how many students graduated in each, {majors.year}. Source: U.S. Department of Education (
        {majors.source.split(",")[0]}). Names are the federal categories, so {collegeName} may call a major something
        slightly different.
      </p>
    </div>
  );
}

function MajorChip({ major, highlighted }: { major: Major; highlighted?: boolean }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        highlighted ? "bg-navy-900 text-white ring-navy-900" : "bg-slate-50 text-slate-700 ring-slate-200"
      )}
    >
      {major.name}
    </span>
  );
}
