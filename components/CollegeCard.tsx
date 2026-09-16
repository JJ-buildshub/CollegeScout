import Link from "next/link";
import { ExternalLink, MapPin, TrendingUp, FileCheck2 } from "lucide-react";
import type { College } from "@/lib/types";
import { admitRateTier, formatPercent } from "@/lib/colleges";
import SystemBadge from "./SystemBadge";
import SaveToggleButton from "./SaveToggleButton";
import TestingPolicyBadge from "./TestingPolicyBadge";

export default function CollegeCard({ college }: { college: College }) {
  return (
    <Link
      href={`/directory/${college.id}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="flex items-start justify-between gap-2">
        <SystemBadge system={college.system} />
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs font-semibold text-slate-400">#{college.rank} Nat'l</span>
          <SaveToggleButton collegeId={college.id} />
        </div>
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-navy-900 group-hover:text-gold-600">
        {college.name}
      </h3>
      <div className="mt-1 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {college.location}
        </div>
        {college.website && (
          <a
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-gold-600"
          >
            Website <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" /> Overall Admit Rate
          </div>
          <div className="mt-0.5 font-bold text-navy-900">
            {formatPercent(college.admitRateOverall)}{" "}
            <span className="font-normal text-slate-400">· {admitRateTier(college.admitRateOverall)}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <FileCheck2 className="h-3.5 w-3.5" /> Testing
          </div>
          <div className="mt-0.5">
            <TestingPolicyBadge policy={college.testingPolicy} className="px-2 py-0.5" />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Mid-50% GPA (UW):</span>{" "}
        {college.mid50_GPA_Unweighted}
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-xs text-slate-500">{college.campusCultureAndVibe}</p>

      <span className="mt-4 text-xs font-semibold text-gold-600">View full profile &rarr;</span>
    </Link>
  );
}
