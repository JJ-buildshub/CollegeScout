"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { FitResult } from "@/lib/types";
import { displayedAdmitRate } from "@/lib/colleges";
import type { PlanningFor } from "@/lib/gpa";
import { SYSTEM_ACCENT } from "./SystemBadge";
import FitCollegeCard from "./FitCollegeCard";

const PAGE_SIZE = 8;

function CompactRow({ result, expanded, onToggle }: { result: FitResult; expanded: boolean; onToggle: () => void }) {
  const { college } = result;
  const accent = SYSTEM_ACCENT[college.system];
  const admitPct = Math.round(displayedAdmitRate(college).value * 100);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${accent.edge}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-navy-900">{college.name}</div>
        <div className="flex items-center gap-1 truncate text-[11px] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" /> {college.location}
        </div>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-navy-900">
        {admitPct}
        <span className="text-xs">%</span>
      </span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
  );
}

type SortMode = "fit" | "rank" | "admitRate" | "name";

const SORT_LABELS: Record<SortMode, string> = {
  fit: "Best fit",
  rank: "Ranking",
  admitRate: "Admit rate (most selective first)",
  name: "Name (A-Z)",
};

/** Schools without a curated `rank` (everything outside the original 125) sort after ranked ones, by name — never given a fabricated rank. */
function sortByRank(a: FitResult, b: FitResult): number {
  const ar = a.college.rank;
  const br = b.college.rank;
  if (ar !== undefined && br !== undefined) return ar - br || a.college.name.localeCompare(b.college.name);
  if (ar !== undefined) return -1;
  if (br !== undefined) return 1;
  return a.college.name.localeCompare(b.college.name);
}

function applySort(results: FitResult[], sortBy: SortMode): FitResult[] {
  const sorted = [...results];
  if (sortBy === "rank") return sorted.sort(sortByRank);
  if (sortBy === "admitRate") {
    return sorted.sort(
      (a, b) => displayedAdmitRate(a.college).value - displayedAdmitRate(b.college).value || a.college.name.localeCompare(b.college.name)
    );
  }
  if (sortBy === "name") return sorted.sort((a, b) => a.college.name.localeCompare(b.college.name));
  return sorted; // "fit" — already sorted by the caller (distance from GPA range)
}

function SchoolSubgroup({
  title,
  results,
  planningFor,
  interestFieldIds,
  scrollTarget,
  sortBy,
}: {
  title: string;
  results: FitResult[];
  planningFor: PlanningFor;
  interestFieldIds: string[];
  scrollTarget: string | null;
  sortBy: SortMode;
}) {
  const sorted = applySort(results, sortBy);
  const targetInGroup = scrollTarget !== null && sorted.some((r) => r.college.id === scrollTarget);
  const [expandedId, setExpandedId] = useState<string | null>(targetInGroup ? scrollTarget : null);
  const [showAll, setShowAll] = useState(
    targetInGroup ? sorted.findIndex((r) => r.college.id === scrollTarget) >= PAGE_SIZE : false
  );

  if (sorted.length === 0) return null;
  const visible = showAll ? sorted : sorted.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500">
        {title}
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-card">
          {results.length}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {visible.map((r) => (
          <div key={r.college.id} id={`fit-${r.college.id}`}>
            <CompactRow
              result={r}
              expanded={expandedId === r.college.id}
              onToggle={() => setExpandedId((prev) => (prev === r.college.id ? null : r.college.id))}
            />
            {expandedId === r.college.id && (
              <div className="mt-1.5">
                <FitCollegeCard result={r} planningFor={planningFor} interestFieldIds={interestFieldIds} />
              </div>
            )}
          </div>
        ))}
      </div>
      {results.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
        >
          {showAll ? "Show fewer" : `Show all ${results.length}`}
        </button>
      )}
    </div>
  );
}

/**
 * Splits a Reach/Target/Likely bucket into Public (UC/CSU/Public) and Private
 * columns, each a compact, expandable list rather than a wall of full cards —
 * a bucket can easily hold 100+ schools once GPA/state/interests are filled
 * in. Each row expands in place into the full FitCollegeCard on click, so
 * nothing about tags, status or "Add to my applications" is lost, just
 * hidden until asked for.
 */
export default function FitResultsList({
  results,
  planningFor,
  interestFieldIds,
  scrollTarget,
}: {
  results: FitResult[];
  planningFor: PlanningFor;
  interestFieldIds: string[];
  scrollTarget?: string | null;
}) {
  const [sortBy, setSortBy] = useState<SortMode>("fit");
  const publicResults = results.filter((r) => r.college.system !== "Private");
  const privateResults = results.filter((r) => r.college.system === "Private");
  const target = scrollTarget ?? null;

  // Once the target row exists in the DOM (expanded/paginated into view on mount), scroll to it —
  // mirrors the highlight-and-scroll behavior "See my fit" from Explore relied on with full cards.
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`fit-${target}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-gold-500", "rounded-lg");
      setTimeout(() => el.classList.remove("ring-2", "ring-gold-500"), 2500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <div>
      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500" htmlFor={`sort-${results[0]?.college.id ?? "empty"}`}>
          Sort by
        </label>
        <select
          id={`sort-${results[0]?.college.id ?? "empty"}`}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortMode)}
          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-gold-500"
        >
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {SORT_LABELS[mode]}
            </option>
          ))}
        </select>
        {sortBy === "rank" && (
          <span className="text-[11px] text-slate-500">Only some schools have a curated ranking; the rest follow, by name.</span>
        )}
      </div>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <SchoolSubgroup title="Public" results={publicResults} planningFor={planningFor} interestFieldIds={interestFieldIds} scrollTarget={target} sortBy={sortBy} />
        <SchoolSubgroup title="Private" results={privateResults} planningFor={planningFor} interestFieldIds={interestFieldIds} scrollTarget={target} sortBy={sortBy} />
      </div>
    </div>
  );
}
