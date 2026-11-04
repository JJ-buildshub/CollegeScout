"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { SummerProgram } from "@/data/summerPrograms";
import { formatSummerDate } from "@/lib/summer";
import SaveToPlanButton from "./SaveToPlanButton";

const CHECK_SITE = "Check official site";

/** Internships and programs this college runs or holds, from the checked list on /summer. */
export default function CollegeProgramsSection({ programs }: { programs: SummerProgram[] }) {
  // The page is built once, so whether a deadline has passed waits for the browser's date.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {programs.map((program) => {
        const { deadline } = program;
        const passed = today && deadline && new Date(`${deadline}T23:59:59`) < today;
        return (
          <article key={program.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-base font-bold leading-snug text-navy-900">{program.name}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{program.host}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold text-slate-500">Who can apply</dt>
                <dd className="mt-0.5 leading-snug text-navy-900">{program.eligibility.gradesLabel ?? <span className="text-slate-500">{CHECK_SITE}</span>}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500">Cost</dt>
                <dd className="mt-0.5 leading-snug text-navy-900">
                  {program.cost ? (
                    <>
                      {program.cost}
                      {program.amount && ` · ${program.amount.text} (${program.amount.year})`}
                    </>
                  ) : (
                    <span className="text-slate-500">{CHECK_SITE}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500">Deadline</dt>
                <dd className="mt-0.5 leading-snug text-navy-900">
                  {deadline ? `${passed ? "Closed " : ""}${formatSummerDate(deadline)}` : <span className="text-slate-500">{CHECK_SITE}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500">Where</dt>
                <dd className="mt-0.5 leading-snug text-navy-900">
                  {program.format.map((f) => (f.kind === "online" ? "Online" : f.place)).join(" or ")}
                </dd>
              </div>
            </dl>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
              <SaveToPlanButton kind="summer" id={program.id} name={program.name} />
              <a
                href={program.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600"
              >
                Official page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
