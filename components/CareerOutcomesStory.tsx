import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { getCollegeById } from "@/lib/colleges";

const EXAMPLE_ID = "cal-poly-san-luis-obispo";

const SIGNALS = ["Job placement rate", "Median starting salary", "Companies that recruit on campus"];

export default function CareerOutcomesStory() {
  const example = getCollegeById(EXAMPLE_ID);

  return (
    <section id="career-outcomes" className="py-4">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            Don&apos;t just ask where you&apos;ll go. Ask where it can take you.
          </h2>
          <p className="mt-4 text-sm text-slate-500 sm:text-base">
            CollegeScout surfaces what actually happens after graduation — wherever a school
            publicly reports it.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
            {SIGNALS.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {example && (
          <Link
            href={`/directory/${example.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-600">
              <Briefcase className="h-3.5 w-3.5" /> Real CollegeScout data
            </div>
            <h3 className="mt-2 text-lg font-bold text-navy-900">{example.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">University-wide, as reported by the school</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold tracking-wide text-slate-400">
                  Placement Rate
                </div>
                <div className="mt-0.5 text-base font-bold text-navy-900">
                  {example.careerOutcomes.placementRate ?? "Not publicly reported"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide text-slate-400">
                  Median Starting Salary
                </div>
                <div className="mt-0.5 text-base font-bold text-navy-900">
                  {example.careerOutcomes.medianStartingSalary ?? "Not publicly reported"}
                </div>
              </div>
            </div>
            {example.careerOutcomes.topRecruiters.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold tracking-wide text-slate-400">
                  Top Recruiters
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {example.careerOutcomes.topRecruiters.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600">
              View full profile <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
