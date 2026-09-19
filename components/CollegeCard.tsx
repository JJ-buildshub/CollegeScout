import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import type { College } from "@/lib/types";
import { admitRateTier, displayedAdmitRate } from "@/lib/colleges";
import { parseGpaRange } from "@/lib/gpa";
import SaveToggleButton from "./SaveToggleButton";
import { SYSTEM_ACCENT } from "./SystemBadge";
import TestingPolicyBadge from "./TestingPolicyBadge";

// A school only gets a stat cell when the value is a real number range —
// "N/A (Not reported)" is dropped rather than shown as an empty box.
function realRange(value: string): string | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  return m ? `${m[1]}–${m[2]}` : null;
}

export default function CollegeCard({ college }: { college: College }) {
  const admitRate = displayedAdmitRate(college);
  const pct = Math.round(admitRate.value * 100);
  const accent = SYSTEM_ACCENT[college.system];
  const gpa = parseGpaRange(college.mid50_GPA_Unweighted) ? realRange(college.mid50_GPA_Unweighted) : null;
  const sat = realRange(college.mid50_SAT);

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className={`h-1.5 ${accent.edge}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[11px] font-bold tracking-wide ${accent.text}`}>
            {college.system}
          </span>
          <div className="relative z-10">
            <SaveToggleButton collegeId={college.id} />
          </div>
        </div>

        {/* The title link stretches over the whole card (after:inset-0), so the
            card is one click target without nesting the Website link inside it. */}
        <h3 className="mt-1 text-lg font-extrabold leading-snug tracking-tight text-navy-900 group-hover:text-gold-600">
          <Link href={`/directory/${college.id}`} className="after:absolute after:inset-0 after:content-['']">
            {college.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {college.location}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums leading-none tracking-tight text-navy-900">
              {pct}
              <span className="text-2xl">%</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">admitted &middot; {admitRateTier(admitRate.value)}</span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`${pct}% admit rate`}
          >
            <div className="h-full rounded-full bg-navy-800" style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
        </div>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {gpa && (
            <div>
              <dt className="text-slate-400">Mid-50% GPA</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy-900">{gpa}</dd>
            </div>
          )}
          {sat && (
            <div>
              <dt className="text-slate-400">Mid-50% SAT</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy-900">{sat}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-400">Testing</dt>
            <dd className="mt-0.5">
              <TestingPolicyBadge policy={college.testingPolicy} className="px-2 py-0.5" />
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between pt-5 text-xs font-semibold">
          <span className="text-gold-600">View profile &rarr;</span>
          {college.website && (
            <a
              href={college.website}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 text-slate-400 hover:text-gold-600"
            >
              Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
