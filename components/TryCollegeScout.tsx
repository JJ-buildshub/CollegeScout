"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Check,
  Cog,
  Cpu,
  Dumbbell,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Landmark,
  LineChart,
  Leaf,
  Megaphone,
  PenTool,
  Palette,
  Scale,
  Stethoscope,
  Syringe,
} from "lucide-react";
import clsx from "clsx";
import { colleges, displayedAdmitRate, formatPercent } from "@/lib/colleges";
import {
  DEFAULT_INTEREST_IDS,
  INTEREST_TAXONOMY,
  MAX_SELECTED_INTERESTS,
  getCombinedProgramLabel,
  getMatchTier,
  getPathwayLabel,
  matchesAllInterests,
  matchesInterest,
  pickDiverseSlate,
} from "@/lib/interests";
import type { College } from "@/lib/types";
import SystemBadge from "./SystemBadge";

const MAX_RESULTS = 6;
// Bumped from 3: several interests in the new, more specific taxonomy
// (e.g. Games & Interactive Media, Sports & Movement) genuinely have single-
// digit real matches in this dataset — the caveat should show for those too,
// not just for a near-zero count.
const LOW_MATCH_THRESHOLD = 8;

const DEFAULT_INTERESTS = INTEREST_TAXONOMY.filter((i) => DEFAULT_INTEREST_IDS.includes(i.id));
const OVERFLOW_INTERESTS = INTEREST_TAXONOMY.filter((i) => !DEFAULT_INTEREST_IDS.includes(i.id));

// One icon per interest id, from the icon library already used across the
// site (lucide-react) — no images. "Psychology" is imported under an alias
// since it collides with the id string used elsewhere in this file.
const INTEREST_ICONS: Record<string, typeof Cog> = {
  engineering: Cog,
  "cs-ai": Cpu,
  "data-science": LineChart,
  business: Briefcase,
  finance: Landmark,
  "medicine-health": Stethoscope,
  nursing: Syringe,
  psychology: Brain,
  "design-architecture": PenTool,
  "art-film-music": Palette,
  "games-interactive": Gamepad2,
  "environment-climate": Leaf,
  "law-policy": Scale,
  education: GraduationCap,
  "sports-movement": Dumbbell,
  "media-communication": Megaphone,
  science: FlaskConical,
};
const NOT_SURE_ICON = HelpCircle;

export default function TryCollegeScout() {
  const [selectedIds, setSelectedIds] = useState<string[]>([DEFAULT_INTEREST_IDS[0]]);
  const [notSure, setNotSure] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const selectedInterests = INTEREST_TAXONOMY.filter((i) => selectedIds.includes(i.id));
  const atLimit = selectedIds.length >= MAX_SELECTED_INTERESTS;

  const toggleInterest = (id: string) => {
    setNotSure(false);
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED_INTERESTS) return prev;
      return [...prev, id];
    });
  };

  const selectNotSure = () => {
    setNotSure(true);
    setSelectedIds([]);
  };

  // Single-interest view: a deliberately varied slate (spread across admit-rate
  // tiers and states) rather than one flat sort, so different interests don't
  // all surface the same handful of schools — see lib/interests.ts's
  // pickDiverseSlate for why match-specificity alone isn't enough here.
  const singleMatches = useMemo(() => {
    if (notSure || selectedIds.length !== 1) return [];
    return colleges.filter((c) => matchesInterest(c, selectedIds[0]));
  }, [selectedIds, notSure]);

  const singleResults = useMemo(() => {
    if (singleMatches.length === 0) return [];
    const candidates = singleMatches.map((college) => ({ college, tier: getMatchTier(college, selectedIds[0]) }));
    return pickDiverseSlate(candidates, MAX_RESULTS).map((college) => ({
      college,
      pathway: getPathwayLabel(college, selectedIds[0]) ?? college.careerMajorTags.primaryDisciplines[0] ?? "",
    }));
  }, [singleMatches, selectedIds]);

  // Multi-interest view: split into "combine" and "strong in each," each
  // drawing its top slate the same diverse way.
  const { combineResults, strongResults, strongTotal } = useMemo(() => {
    if (notSure || selectedIds.length < 2) {
      return { combineResults: [], strongResults: [], strongTotal: 0 };
    }
    const combineLabels = new Map<string, string>();
    for (const c of colleges) {
      const label = getCombinedProgramLabel(c, selectedIds);
      if (label) combineLabels.set(c.id, label);
    }
    const combineCandidates = colleges
      .filter((c) => combineLabels.has(c.id))
      .map((college) => ({ college, tier: 1 }));
    const combineSlate = pickDiverseSlate(combineCandidates, MAX_RESULTS).map((college) => ({
      college,
      label: combineLabels.get(college.id)!,
    }));

    const strong = colleges.filter((c) => !combineLabels.has(c.id) && matchesAllInterests(c, selectedIds));
    const strongCandidates = strong.map((college) => ({
      college,
      tier: Math.min(...selectedIds.map((id) => getMatchTier(college, id))),
    }));

    return {
      combineResults: combineSlate,
      strongResults: pickDiverseSlate(strongCandidates, MAX_RESULTS),
      strongTotal: strong.length,
    };
  }, [selectedIds, notSure]);

  const isMulti = !notSure && selectedIds.length > 1;
  const isSingle = !notSure && selectedIds.length === 1;
  const selectedLabel = selectedInterests.map((i) => i.label).join(", ");
  const interestsQuery = selectedIds.join(",");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 pb-6 pt-8 shadow-card sm:px-10 sm:pb-10 sm:pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
          What are you interested in?
        </h2>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {DEFAULT_INTERESTS.map((interest) => (
          <InterestCard
            key={interest.id}
            interest={interest}
            selected={selectedIds.includes(interest.id)}
            disabled={!selectedIds.includes(interest.id) && atLimit}
            onClick={() => toggleInterest(interest.id)}
          />
        ))}

        {showMore &&
          OVERFLOW_INTERESTS.map((interest) => (
            <InterestCard
              key={interest.id}
              interest={interest}
              selected={selectedIds.includes(interest.id)}
              disabled={!selectedIds.includes(interest.id) && atLimit}
              onClick={() => toggleInterest(interest.id)}
            />
          ))}

        <InterestCard
          interest={{ id: "not-sure", label: "Not sure yet", subtitle: "Let's figure it out" }}
          icon={NOT_SURE_ICON}
          selected={notSure}
          disabled={false}
          onClick={selectNotSure}
        />
      </div>

      <div className="mx-auto mt-3 max-w-xl text-center">
        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-sm font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
          >
            Show {OVERFLOW_INTERESTS.length} more
          </button>
        )}
        <p className="mt-1 text-xs text-slate-400">Pick up to {MAX_SELECTED_INTERESTS} interests to compare.</p>
      </div>

      {notSure ? (
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
          {isSingle && (
            <>
              <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {singleResults.map(({ college, pathway }) => (
                  <ResultCard key={college.id} college={college}>
                    <p className="mt-2 text-xs font-semibold text-gold-600">{pathway}</p>
                    <p className="mt-2 flex-1 text-xs text-slate-500">
                      A dedicated program built specifically around {selectedLabel.toLowerCase()}.
                    </p>
                  </ResultCard>
                ))}
              </div>

              {singleMatches.length === 0 && (
                <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-600">
                    No school in this dataset has a clearly tagged {selectedLabel} pathway &mdash; that doesn&apos;t
                    mean none exist, just that we can&apos;t confidently point to one yet.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/directory"
                      className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                    >
                      Browse the Directory <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {singleMatches.length > 0 && singleMatches.length < LOW_MATCH_THRESHOLD && (
                <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-400">
                  Only {singleMatches.length} school{singleMatches.length === 1 ? "" : "s"} in this dataset{" "}
                  {singleMatches.length === 1 ? "has" : "have"} a clearly tagged {selectedLabel} pathway &mdash;
                  that doesn&apos;t mean other schools don&apos;t offer it. Try a related interest, or{" "}
                  <Link href="/directory" className="font-semibold text-navy-900 underline underline-offset-2">
                    browse everything
                  </Link>
                  .
                </p>
              )}
            </>
          )}

          {isMulti && (
            <>
              <div className="mx-auto mt-8 max-w-4xl">
                <h3 className="text-sm font-bold tracking-wide text-slate-600">
                  Programs that combine these
                </h3>
                {combineResults.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {combineResults.map(({ college, label }) => (
                      <ResultCard key={college.id} college={college}>
                        <p className="mt-2 text-xs font-semibold text-gold-600">{label}</p>
                        <p className="mt-2 flex-1 text-xs text-slate-500">
                          One program built around {selectedLabel.toLowerCase()} together.
                        </p>
                      </ResultCard>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No school in this dataset has one program combining all of {selectedLabel} &mdash; here&apos;s
                    who&apos;s strong in each field separately:
                  </p>
                )}
              </div>

              <div className="mx-auto mt-8 max-w-4xl">
                <h3 className="text-sm font-bold tracking-wide text-slate-600">
                  Schools strong in each
                </h3>
                {strongResults.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {strongResults.map((college) => (
                      <ResultCard key={college.id} college={college}>
                        <div className="mt-2 space-y-0.5">
                          {selectedInterests.map((interest) => (
                            <p key={interest.id} className="text-xs font-semibold text-gold-600">
                              {interest.label}: {getPathwayLabel(college, interest.id) ?? interest.label}
                            </p>
                          ))}
                        </div>
                        <p className="mt-2 flex-1 text-xs text-slate-500">
                          Separate strong programs in each field &mdash; not a joint degree.
                        </p>
                      </ResultCard>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No school in this dataset is clearly tagged for all of {selectedLabel} at once. Try dropping
                    one interest, or{" "}
                    <Link href="/directory" className="font-semibold text-navy-900 underline underline-offset-2">
                      browse everything
                    </Link>
                    .
                  </p>
                )}
                {strongTotal > 0 && strongTotal < LOW_MATCH_THRESHOLD && (
                  <p className="mt-3 text-xs text-slate-400">
                    Only {strongTotal} school{strongTotal === 1 ? "" : "s"} in this dataset{" "}
                    {strongTotal === 1 ? "matches" : "match"} all of {selectedLabel} &mdash; that doesn&apos;t
                    mean other schools don&apos;t offer these. Try dropping an interest, or{" "}
                    <Link href="/directory" className="font-semibold text-navy-900 underline underline-offset-2">
                      browse everything
                    </Link>
                    .
                  </p>
                )}
              </div>

              {combineResults.length === 0 && strongTotal === 0 && (
                <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-600">
                    No school in this dataset is clearly tagged for all of {selectedLabel} at once &mdash; that
                    doesn&apos;t mean none exist, just that we can&apos;t confidently point to one yet.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/directory"
                      className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                    >
                      Browse the Directory <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="mx-auto mt-6 max-w-xl text-center text-xs text-slate-400">
            These are examples of how each program is structured &mdash; not a ranking or a recommendation.
            Every interest above can be explored the same way.
          </p>

          <div className="mt-6 text-center">
            <Link
              href={`/directory?interests=${interestsQuery}`}
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

/**
 * Selected state is shown two ways at once — a filled check badge and a
 * heavier navy border/background — never color alone, so it still reads
 * correctly without relying on the gold/navy contrast (e.g. for a
 * colorblind viewer, or on a washed-out screen).
 */
function InterestCard({
  interest,
  icon,
  selected,
  disabled,
  onClick,
}: {
  interest: { id: string; label: string; subtitle: string };
  icon?: typeof Cog;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = icon ?? INTEREST_ICONS[interest.id] ?? HelpCircle;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-navy-900 bg-navy-900/5"
          : disabled
            ? "cursor-not-allowed border-slate-100 opacity-50"
            : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-navy-900 text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
      <Icon className="h-5 w-5 text-navy-900" strokeWidth={1.75} />
      <div className="text-sm font-bold leading-snug text-navy-900">{interest.label}</div>
      <div className="text-xs leading-snug text-slate-500">{interest.subtitle}</div>
    </button>
  );
}

function ResultCard({ college, children }: { college: College; children: React.ReactNode }) {
  return (
    <Link
      href={`/directory/${college.id}`}
      className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
    >
      <SystemBadge system={college.system} className="self-start" />
      <h3 className="mt-3 text-sm font-bold leading-snug text-navy-900">{college.name}</h3>
      {children}
      <p className="mt-3 text-xs text-slate-400">{formatPercent(displayedAdmitRate(college).value)} overall admit</p>
      <span className="mt-2 text-xs font-semibold text-navy-900">View School &rarr;</span>
    </Link>
  );
}
