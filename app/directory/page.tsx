"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { colleges } from "@/lib/colleges";
import type { CollegeSystem, TestingPolicy } from "@/lib/types";
import { getInterestById, matchesAllInterests } from "@/lib/interests";
import CollegeCard from "@/components/CollegeCard";

const SYSTEM_OPTIONS: CollegeSystem[] = ["UC", "CSU", "Private", "Out-of-State Public"];
const TESTING_OPTIONS: TestingPolicy[] = ["Test-Free", "Test-Required", "Test-Optional", "Test-Blind"];

type AdmitBucket = "any" | "under15" | "15to35" | "35to60" | "over60";

const ADMIT_BUCKETS: { id: AdmitBucket; label: string }[] = [
  { id: "any", label: "Any admit rate" },
  { id: "under15", label: "Under 15%" },
  { id: "15to35", label: "15% – 35%" },
  { id: "35to60", label: "35% – 60%" },
  { id: "over60", label: "Over 60%" },
];

function matchesBucket(rate: number, bucket: AdmitBucket): boolean {
  switch (bucket) {
    case "under15":
      return rate < 0.15;
    case "15to35":
      return rate >= 0.15 && rate < 0.35;
    case "35to60":
      return rate >= 0.35 && rate < 0.6;
    case "over60":
      return rate >= 0.6;
    default:
      return true;
  }
}

function DirectoryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [systems, setSystems] = useState<Set<CollegeSystem>>(new Set());
  const [testingPolicies, setTestingPolicies] = useState<Set<TestingPolicy>>(new Set());
  const [admitBucket, setAdmitBucket] = useState<AdmitBucket>("any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"rank" | "admitRateOverall" | "name" | "cost">("rank");
  const [interestIds, setInterestIds] = useState<string[]>(() => {
    const raw = searchParams.get("interests");
    return raw ? raw.split(",").filter(Boolean) : [];
  });

  // Keep the URL in sync so an interest-filtered view stays bookmarkable/shareable
  // and survives back-navigation from a college profile.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (interestIds.length > 0) {
      params.set("interests", interestIds.join(","));
    } else {
      params.delete("interests");
    }
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestIds]);

  const selectedInterests = interestIds.map(getInterestById).filter((i): i is NonNullable<typeof i> => !!i);
  const removeInterest = (id: string) => setInterestIds((prev) => prev.filter((x) => x !== id));

  const toggleSystem = (system: CollegeSystem) => {
    setSystems((prev) => {
      const next = new Set(prev);
      next.has(system) ? next.delete(system) : next.add(system);
      return next;
    });
  };

  const toggleTesting = (policy: TestingPolicy) => {
    setTestingPolicies((prev) => {
      const next = new Set(prev);
      next.has(policy) ? next.delete(policy) : next.add(policy);
      return next;
    });
  };

  const clearFilters = () => {
    setSystems(new Set());
    setTestingPolicies(new Set());
    setAdmitBucket("any");
    setQuery("");
  };

  const activeFilterCount = systems.size + testingPolicies.size + (admitBucket !== "any" ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colleges
      .filter((c) => {
        if (q && !c.name.toLowerCase().includes(q) && !c.location.toLowerCase().includes(q)) return false;
        if (systems.size > 0 && !systems.has(c.system)) return false;
        if (testingPolicies.size > 0 && !testingPolicies.has(c.testingPolicy)) return false;
        if (!matchesBucket(c.admitRateOverall, admitBucket)) return false;
        if (interestIds.length > 0 && !matchesAllInterests(c, interestIds)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "admitRateOverall") return a.admitRateOverall - b.admitRateOverall;
        if (sortBy === "cost") {
          const costA = a.financials.coaInState ?? a.financials.coaOutOfState ?? Infinity;
          const costB = b.financials.coaInState ?? b.financials.coaOutOfState ?? Infinity;
          return costA - costB;
        }
        return a.rank - b.rank;
      });
  }, [query, systems, testingPolicies, admitBucket, sortBy, interestIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          College Intelligence Directory
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search and filter {colleges.length} benchmark schools by system, testing policy, and admit rate.
        </p>
      </div>

      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedInterests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-3 py-1.5 text-xs font-semibold text-navy-900"
            >
              Interest: {interest.label}
              <button
                type="button"
                onClick={() => removeInterest(interest.id)}
                aria-label={`Remove ${interest.label} filter`}
                className="rounded-full p-0.5 hover:bg-gold-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by college name or location..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none ring-gold-500 focus:ring-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-card sm:w-auto",
            filtersOpen ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 bg-white text-navy-900"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-gold-500 px-1.5 py-0.5 text-xs text-navy-950">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-card outline-none focus:ring-2 focus:ring-gold-500"
        >
          <option value="rank">Sort: National Rank</option>
          <option value="admitRateOverall">Sort: Admit Rate</option>
          <option value="cost">Sort: Cost (low to high)</option>
          <option value="name">Sort: Name (A-Z)</option>
        </select>
      </div>

      {filtersOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">System</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {SYSTEM_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSystem(s)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      systems.has(s)
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Testing Policy</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {TESTING_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTesting(t)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      testingPolicies.has(t)
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Admit Rate</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ADMIT_BUCKETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setAdmitBucket(b.id)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      admitBucket === b.id
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="text-xs font-medium text-slate-400">
        Showing {filtered.length} of {colleges.length} schools
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((college) => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
          No schools match your filters. Try clearing a few.
        </div>
      )}
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={null}>
      <DirectoryContent />
    </Suspense>
  );
}
