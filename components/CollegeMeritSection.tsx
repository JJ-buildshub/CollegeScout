import { CalendarClock, ExternalLink, GraduationCap } from "lucide-react";
import type { MeritScholarship } from "@/lib/collegeMerit";

/**
 * Merit scholarships that belong to this one college, under Financial Aid on
 * its profile. Each line links to the scholarship's own page.
 */
export default function CollegeMeritSection({ scholarships }: { scholarships: MeritScholarship[] }) {
  return (
    <div className="max-w-2xl space-y-4">
      {scholarships.map((s) => (
        <div key={s.name} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gold-600" />
              <h3 className="text-sm font-bold text-navy-900">{s.name}</h3>
            </div>
            <span className="rounded-full bg-gold-500/10 px-2.5 py-1 text-xs font-semibold text-gold-600 ring-1 ring-inset ring-gold-500/20">
              {s.award}
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CalendarClock className="h-3.5 w-3.5" />
            Its own deadline: {s.deadline}
          </div>
          <ul className="mt-3 space-y-3">
            {s.facts.map((fact) => (
              <li key={fact.text} className="text-sm leading-snug text-slate-600">
                {fact.text}
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {fact.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 hover:text-gold-700"
                    >
                      {source.label} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
