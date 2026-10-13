"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Check,
  Cog,
  Cpu,
  Dumbbell,
  Dna,
  Lightbulb,
  Music,
  Users,
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
import { ADMIT_TIER_RANGE, admitRateTier, colleges, displayedAdmitRate, formatPercent } from "@/lib/colleges";
import SaveToggleButton from "./SaveToggleButton";
import {
  DEFAULT_INTEREST_IDS,
  INTEREST_TAXONOMY,
  MAX_SELECTED_INTERESTS,
  byDegreesDesc,
  countMatches,
  degreesAcrossInterests,
  degreesForInterest,
  findCombinedProgram,
  getInterestById,
  getMatchTier,
  getPathwayLabel,
  matchesInterest,
  pickDiverseSlate,
} from "@/lib/interests";
import { MIN_PROGRAM_DEGREES, PROGRAMS_SOURCE } from "@/lib/programs";
import type { College } from "@/lib/types";
import SystemBadge from "./SystemBadge";

const MAX_RESULTS = 6;
// A school offering only some of the picked fields is shown under the exact
// combination it offers, and there can be several combinations, so each gets
// one example per selectivity tier rather than six.
const MAX_PARTIAL_RESULTS = 4;
// Bumped from 3: several interests in the new, more specific taxonomy
// (e.g. Games & Interactive Media, Sports & Movement) genuinely have single-
// digit real matches in this dataset — the caveat should show for those too,
// not just for a near-zero count.
const LOW_MATCH_THRESHOLD = 8;
const SELECTION_STORAGE_KEY = "collegescout:home-interests";

const DEFAULT_INTERESTS = INTEREST_TAXONOMY.filter((i) => DEFAULT_INTEREST_IDS.includes(i.id));
const OVERFLOW_INTERESTS = INTEREST_TAXONOMY.filter((i) => !DEFAULT_INTEREST_IDS.includes(i.id));
const HEALTH_LIFE_FIELDS = OVERFLOW_INTERESTS.filter((i) => i.group === "health-life");
const PEOPLE_BUSINESS_FIELDS = OVERFLOW_INTERESTS.filter((i) => i.group === "people-business");
const PATH_INTERESTS = OVERFLOW_INTERESTS.filter((i) => i.group === "paths");

// Groups example results by admit-rate tier (the same bands pickDiverseSlate
// already spreads its picks across, see lib/interests.ts) so a visitor sees
// this interest spans the full range of selectivity, not just a raw count —
// a preview of the Reach/Target/Likely idea before they've entered a GPA on
// My Fit, which uses a personalized version of this same spread.
const TIER_ORDER = ["Ultra-Selective", "Highly Selective", "Selective", "Accessible"] as const;

function groupByTier<T extends { college: College }>(items: T[]): { tier: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const tier = admitRateTier(displayedAdmitRate(item.college).value);
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier)!.push(item);
  }
  return TIER_ORDER.filter((tier) => groups.has(tier)).map((tier) => ({ tier, items: groups.get(tier)! }));
}

/** Counts every match (not just the examples shown) per tier, for the "12 schools" label next to each tier heading. */
function countsByTier(list: College[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const college of list) {
    const tier = admitRateTier(displayedAdmitRate(college).value);
    counts.set(tier, (counts.get(tier) ?? 0) + 1);
  }
  return counts;
}

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
  entrepreneurship: Lightbulb,
  biology: Dna,
  "social-sciences": Users,
  "music-performing": Music,
  "visual-arts": Palette,
  "games-interactive": Gamepad2,
  "environment-climate": Leaf,
  "law-policy": Scale,
  education: GraduationCap,
  "sports-movement": Dumbbell,
  "media-communication": Megaphone,
};
const NOT_SURE_ICON = HelpCircle;

/**
 * The named program at this school for an interest, when its curated tags have
 * one that says more than the interest's own name ("Engineering: Engineering"
 * told a reader nothing). Empty otherwise — the card is already in that
 * interest's list.
 */
function pathwayNote(college: College, interestId: string): string {
  const label = getPathwayLabel(college, interestId);
  const interestLabel = getInterestById(interestId)?.label ?? "";
  return label && label.toLowerCase() !== interestLabel.toLowerCase() ? label : "";
}

export default function TryCollegeScout() {
  // Entrepreneurship rather than the first chip in the list: it's a field a
  // student is unlikely to have a fixed school list for already, so the results
  // are more likely to show them somewhere they hadn't thought of.
  const [selectedIds, setSelectedIds] = useState<string[]>(["entrepreneurship"]);
  const [notSure, setNotSure] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // The selection lives in sessionStorage as well as in state, because opening
  // a school unmounts this component and coming back remounts it — without
  // this, Back returned to Entrepreneurship rather than to what the student
  // had picked. Session rather than local storage on purpose: a new visit
  // should still open on the default. Restored in an effect, not in the
  // initial state, so the first render matches the server's.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SELECTION_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const ids = Array.isArray(saved?.selectedIds)
          ? saved.selectedIds
              .filter((id: unknown) => INTEREST_TAXONOMY.some((i) => i.id === id))
              .slice(0, MAX_SELECTED_INTERESTS)
          : [];
        setSelectedIds(ids);
        setNotSure(saved?.notSure === true);
        setShowMore(saved?.showMore === true);
      }
    } catch {
      // Storage unavailable or unreadable — keep the default selection.
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify({ selectedIds, notSure, showMore }));
    } catch {
      // Storage unavailable — the selection just won't survive leaving the page.
    }
  }, [restored, selectedIds, notSure, showMore]);

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
    const candidates = singleMatches.map((college) => ({
      college,
      tier: getMatchTier(college, selectedIds[0]),
      degrees: degreesForInterest(college, selectedIds[0]),
    }));
    return pickDiverseSlate(candidates, MAX_RESULTS).map((college) => ({
      college,
      pathway: pathwayNote(college, selectedIds[0]),
    }));
  }, [singleMatches, selectedIds]);

  // Every match, not just the diverse-slate examples — rendered per tier only
  // once that tier's "See all" is expanded.
  const singleFullResults = useMemo(() => {
    return singleMatches
      .map((college) => ({
        college,
        degrees: degreesForInterest(college, selectedIds[0]),
        pathway: pathwayNote(college, selectedIds[0]),
      }))
      .sort(byDegreesDesc);
  }, [singleMatches, selectedIds]);

  const singleTierCounts = useMemo(() => countsByTier(singleMatches), [singleMatches]);

  // Which tiers are currently expanded to show every match, per results
  // section — reset whenever the selection changes so a new interest doesn't
  // inherit a stale expansion.
  const [singleExpandedTiers, setSingleExpandedTiers] = useState<Set<string>>(new Set());
  // Keyed by the combination of picked interests a section's schools offer.
  const [multiExpandedTiers, setMultiExpandedTiers] = useState<Record<string, Set<string>>>({});
  // With three interests, schools offering just one are the weakest matches and
  // the longest list, so they start as a one-line summary.
  const [showSingleField, setShowSingleField] = useState(false);
  useEffect(() => {
    setSingleExpandedTiers(new Set());
    setMultiExpandedTiers({});
    setShowSingleField(false);
  }, [selectedIds, notSure]);

  function toggleTier(setter: (fn: (prev: Set<string>) => Set<string>) => void, tier: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  function toggleMultiTier(key: string, tier: string) {
    setMultiExpandedTiers((prev) => {
      const next = new Set(prev[key] ?? []);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return { ...prev, [key]: next };
    });
  }

  // Multi-interest view. A student picking several fields is saying "any of
  // these interests me", not "only show me schools with every one". So every
  // school offering at least one is included, grouped by how many of the
  // picked fields it offers — all of them first. Below that, schools are split
  // by exactly which fields they offer: ordering a mixed group by programme
  // size let the large fields (engineering, computing) take every example slot
  // and hid a smaller one (nursing) the student had also asked for. A school
  // with a single degree joining the fields says so on its card.
  const multiGroups = useMemo(() => {
    if (notSure || selectedIds.length < 2) return [];
    const rows = colleges
      .map((college) => {
        const matchedIds = selectedIds.filter((id) => matchesInterest(college, id));
        return {
          college,
          matchedIds,
          tier: Math.min(4, ...matchedIds.map((id) => getMatchTier(college, id))),
          degrees: degreesAcrossInterests(college, matchedIds),
          combined: findCombinedProgram(college, matchedIds),
        };
      })
      .filter((row) => row.matchedIds.length > 0);

    const groups = [];
    for (let matchCount = selectedIds.length; matchCount >= 1; matchCount--) {
      const inGroup = rows.filter((row) => row.matchedIds.length === matchCount);
      if (inGroup.length === 0) continue;
      const byCombination = new Map<string, typeof inGroup>();
      for (const row of inGroup) {
        const key = row.matchedIds.join("+");
        byCombination.set(key, [...(byCombination.get(key) ?? []), row]);
      }
      const limit = matchCount === selectedIds.length ? MAX_RESULTS : MAX_PARTIAL_RESULTS;
      const sections = [...byCombination.entries()]
        .map(([key, members]) => {
          const byId = new Map(members.map((m) => [m.college.id, m]));
          return {
            key,
            label: members[0].matchedIds.map((id) => getInterestById(id)?.label ?? id).join(" + "),
            total: members.length,
            tierCounts: countsByTier(members.map((m) => m.college)),
            examples: pickDiverseSlate(members, limit).map((college) => byId.get(college.id)!),
            full: [...members].sort(byDegreesDesc),
          };
        })
        .sort((a, b) => b.total - a.total);
      groups.push({ matchCount, total: inGroup.length, sections });
    }
    return groups;
  }, [selectedIds, notSure]);

  const multiTotal = multiGroups.reduce((sum, g) => sum + g.total, 0);
  const multiAllTotal = multiGroups.find((g) => g.matchCount === selectedIds.length)?.total ?? 0;
  const allOfThem = selectedIds.length === 2 ? "both" : `all ${selectedIds.length}`;
  const multiGroupHeading = (matchCount: number) =>
    matchCount === selectedIds.length
      ? `Schools offering ${allOfThem}`
      : matchCount === 1
        ? "Schools offering one of them"
        : `Schools offering ${matchCount} of the ${selectedIds.length}`;

  const isMulti = !notSure && selectedIds.length > 1;
  const isSingle = !notSure && selectedIds.length === 1;
  const selectedLabel = selectedInterests.map((i) => i.label).join(", ");
  const interestsQuery = selectedIds.join(",");
  const singleTotal = isSingle ? countMatches(colleges, selectedIds[0]) : 0;
  const singleLabelArticle = /^[aeiou]/i.test(selectedLabel) ? "an" : "a";

  return (
    <section
      id="interests"
      className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white px-6 pb-6 pt-8 shadow-card sm:px-10 sm:pb-10 sm:pt-10"
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* A bridge out of the argument and into the tool. Without it the page
            went from a story about two schools straight into a selector grid. */}
        <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
          What are you interested in?
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Your turn. Pick a subject and see which schools teach it &mdash; sorted by how hard they
          are to get into, not by rank.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-4xl">
        <InterestGroup label="Popular fields">
          {DEFAULT_INTERESTS.map((interest) => (
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
        </InterestGroup>

        {showMore && (
          <>
            <InterestGroup label="Health & life sciences" className="mt-5">
              {HEALTH_LIFE_FIELDS.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  selected={selectedIds.includes(interest.id)}
                  disabled={!selectedIds.includes(interest.id) && atLimit}
                  onClick={() => toggleInterest(interest.id)}
                />
              ))}
            </InterestGroup>

            <InterestGroup label="Social sciences & business" className="mt-5">
              {PEOPLE_BUSINESS_FIELDS.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  selected={selectedIds.includes(interest.id)}
                  disabled={!selectedIds.includes(interest.id) && atLimit}
                  onClick={() => toggleInterest(interest.id)}
                />
              ))}
            </InterestGroup>

            <InterestGroup label="Creative and other paths" className="mt-5">
              {PATH_INTERESTS.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  selected={selectedIds.includes(interest.id)}
                  disabled={!selectedIds.includes(interest.id) && atLimit}
                  onClick={() => toggleInterest(interest.id)}
                />
              ))}
            </InterestGroup>
          </>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-xl text-center">
        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-sm font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
          >
            Show {OVERFLOW_INTERESTS.length} more
          </button>
        )}
        <p className="mt-1 text-xs text-slate-500">Pick up to {MAX_SELECTED_INTERESTS} interests to compare.</p>
      </div>

      {notSure ? (
        <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-sand-100 p-6 text-center">
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
              href="#compare"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy-900 hover:border-slate-300"
            >
              See a side-by-side
            </a>
          </div>
        </div>
      ) : (
        <>
          {isSingle && singleTotal > 0 && (
            <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-white">
              <p className="text-sm font-semibold">
                <span className="text-2xl font-black tabular-nums text-gold-400">{singleTotal}</span>{" "}
                school{singleTotal === 1 ? "" : "s"} {singleTotal === 1 ? "offers" : "offer"} {singleLabelArticle} {selectedLabel} program
                {singleTotal > MAX_RESULTS ? ` — showing ${MAX_RESULTS} examples below` : ""}
              </p>
              <button
                type="button"
                onClick={() => setSingleExpandedTiers(new Set(TIER_ORDER))}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-navy-950 hover:bg-gold-400"
              >
                See all {singleTotal} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {isSingle && singleTotal > 0 && <HowChosen multi={false} />}

          {isSingle && (
            <>
              <div className="mx-auto mt-6 max-w-4xl">
                {groupByTier(singleResults).map(({ tier, items }) => (
                  <ResultTierGroup
                    key={tier}
                    tier={tier}
                    total={singleTierCounts.get(tier) ?? items.length}
                    expanded={singleExpandedTiers.has(tier)}
                    onToggle={() => toggleTier(setSingleExpandedTiers, tier)}
                    exampleItems={items}
                    fullItems={groupByTier(singleFullResults).find((g) => g.tier === tier)?.items ?? items}
                    renderCard={({ college, pathway }) => (
                      <ResultCard key={college.id} college={college} interestsQuery={interestsQuery}>
                        <p className="mt-1.5 flex-1 text-xs font-semibold text-gold-600">{pathway}</p>
                      </ResultCard>
                    )}
                  />
                ))}
              </div>

              {singleMatches.length === 0 && (
                <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-sand-100 p-6 text-center">
                  <p className="text-sm text-slate-600">
                    No school in this dataset has a {selectedLabel} program we can point to &mdash; that doesn&apos;t
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
                <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-500">
                  Only {singleMatches.length} school{singleMatches.length === 1 ? "" : "s"} in this dataset{" "}
                  {singleMatches.length === 1 ? "has" : "have"} a {selectedLabel} program we can point to &mdash;
                  that doesn&apos;t mean other schools don&apos;t offer it. Try a related interest, or{" "}
                  <Link href="/directory" className="font-semibold text-navy-900 underline underline-offset-2">
                    browse everything
                  </Link>
                  .
                </p>
              )}
            </>
          )}

          {isMulti && multiTotal > 0 && (
            <>
              <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-white">
                <p className="text-sm font-semibold">
                  <span className="text-2xl font-black tabular-nums text-gold-400">{multiTotal}</span>{" "}
                  school{multiTotal === 1 ? "" : "s"} offer at least one of {selectedLabel}
                  {multiAllTotal > 0 ? ` — ${multiAllTotal} offer ${allOfThem}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => {
                      setShowSingleField(true);
                      setMultiExpandedTiers(
                        Object.fromEntries(
                          multiGroups.flatMap((g) => g.sections.map((sec) => [sec.key, new Set<string>(TIER_ORDER)]))
                        )
                      );
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-navy-950 hover:bg-gold-400"
                >
                  See all {multiTotal} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <HowChosen multi />

              {multiGroups.map((group) => {
                const collapsed = group.matchCount === 1 && selectedIds.length === 3 && !showSingleField;
                return (
                  <div key={group.matchCount} className="mx-auto mt-8 max-w-4xl">
                    <h3 className="text-sm font-bold tracking-wide text-slate-600">
                      {multiGroupHeading(group.matchCount)}{" "}
                      <span className="font-semibold text-slate-500">&middot; {group.total}</span>
                    </h3>
                    {collapsed ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {group.sections.map((section) => `${section.label} only (${section.total})`).join(", ")}.{" "}
                        <button
                          type="button"
                          onClick={() => setShowSingleField(true)}
                          className="font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
                        >
                          Show them
                        </button>
                      </p>
                    ) : (
                      group.sections.map((section) => (
                        <div key={section.key} className="mt-3">
                          {group.matchCount < selectedIds.length && (
                            <p className="mb-2 text-sm font-semibold text-navy-900">
                              {section.label}
                              {group.matchCount === 1 ? " only" : ""}{" "}
                              <span className="font-normal text-slate-500">
                                &middot; {section.total} school{section.total === 1 ? "" : "s"}
                              </span>
                            </p>
                          )}
                          {groupByTier(section.examples).map(({ tier, items }) => (
                            <ResultTierGroup
                              key={tier}
                              tier={tier}
                              total={section.tierCounts.get(tier) ?? items.length}
                              expanded={multiExpandedTiers[section.key]?.has(tier) ?? false}
                              onToggle={() => toggleMultiTier(section.key, tier)}
                              exampleItems={items}
                              fullItems={groupByTier(section.full).find((g) => g.tier === tier)?.items ?? items}
                              renderCard={({ college, matchedIds, combined }) => (
                                <ResultCard key={college.id} college={college} interestsQuery={interestsQuery}>
                                  <div className="mt-2 flex-1 space-y-0.5">
                                    {matchedIds.map((id) => {
                                      const label = getInterestById(id)?.label ?? id;
                                      const note = pathwayNote(college, id);
                                      return (
                                        <p key={id} className="text-xs font-semibold text-gold-600">
                                          {label}
                                          {note ? `: ${note}` : ""}
                                        </p>
                                      );
                                    })}
                                  </div>
                                  {combined && (
                                    <p className="mt-2 rounded-lg bg-navy-900 px-2 py-1 text-[11px] font-semibold leading-snug text-white">
                                      Combined program: {combined.label}
                                    </p>
                                  )}
                                </ResultCard>
                              )}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </>
          )}

          {isMulti && multiTotal === 0 && (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-sand-100 p-6 text-center">
              <p className="text-sm text-slate-600">
                No school in this dataset has a program we can point to in any of {selectedLabel} &mdash; that
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

          <div className="mt-6 text-center">
            <Link
              href={`/directory?interests=${interestsQuery}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:border-slate-300"
            >
              {isMulti ? `Explore schools offering ${allOfThem}` : "See all matching programs"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * The rules behind the results, in the order they are applied, so a family can
 * see why a school is or isn't here and why it sits where it does. Closed by
 * default; every number in it is read from the same constants the matching
 * uses, so the explanation cannot drift from what the code does.
 */
function HowChosen({ multi }: { multi: boolean }) {
  return (
    <details className="mx-auto mt-3 max-w-4xl rounded-2xl border border-slate-200 bg-sand-50 px-5 py-3 text-sm text-slate-600">
      <summary className="cursor-pointer font-semibold text-navy-900">How we chose and ordered these schools</summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          <span className="font-semibold text-navy-900">Which schools count.</span> A school counts for a field when it
          awarded at least {MIN_PROGRAM_DEGREES} bachelor&apos;s degrees in it in {PROGRAMS_SOURCE.year} (
          {PROGRAMS_SOURCE.source.split(",")[0]}, U.S. Department of Education), or when a program it runs names the
          field. A newer or very small program can be missed.
        </li>
        {multi && (
          <li>
            <span className="font-semibold text-navy-900">More of your fields first.</span> Schools offering every field
            you picked come first, then schools offering some of them, grouped by exactly which ones, so you can see
            what each school is missing.
          </li>
        )}
        <li>
          <span className="font-semibold text-navy-900">Grouped by how hard they are to get into.</span> Four groups by
          admit rate, from under 15% to over 60%, so you see reaches and realistic options side by side.
        </li>
        <li>
          <span className="font-semibold text-navy-900">Largest programs first.</span> Within a group, the school
          awarding the most degrees in {multi ? "your fields" : "the field"} leads
          {multi
            ? ", after any school with one program that combines them. For a school offering several of your fields, we use its smallest one, so a school leads only if it is sizeable in each."
            : "."}{" "}
          Size is not quality: a small program can be excellent.
        </li>
        <li>
          <span className="font-semibold text-navy-900">A few examples, then everything.</span> You first see a handful
          per group, from different states where possible. &ldquo;See all&rdquo; shows every school that counts.
        </li>
      </ol>
      <p className="mt-3 text-xs text-slate-500">
        This is not a ranking and not a recommendation. It does not yet know your grades, your state or your budget
        &mdash; My Fit does that part.
      </p>
    </details>
  );
}

/**
 * Selected state is shown two ways at once — a filled check badge and a
 * heavier navy border/background — never color alone, so it still reads
 * correctly without relying on the gold/navy contrast (e.g. for a
 * colorblind viewer, or on a washed-out screen).
 */
function InterestGroup({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</h3>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

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
        "flex h-full flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-colors",
        selected
          ? "border-navy-900 bg-navy-900 text-white"
          : disabled
            ? "cursor-not-allowed border-slate-100 text-slate-400 opacity-50"
            : "border-slate-200 bg-white text-navy-900 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span className="flex items-center gap-2">
        {selected ? <Check className="h-4 w-4 shrink-0" strokeWidth={3} /> : <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
        <span className="text-sm font-semibold leading-tight">{interest.label}</span>
      </span>
      <span className={clsx("text-xs leading-snug", selected ? "text-slate-300" : "text-slate-500")}>
        {interest.subtitle}
      </span>
    </button>
  );
}

const TIER_GROUP_PAGE_SIZE = 9;

/**
 * One selectivity-tier section of homepage example results. Shows just the
 * diverse-slate examples by default; "See all N" expands in place to every
 * match in this tier (itself paginated past TIER_GROUP_PAGE_SIZE) instead of
 * navigating away, since these are meant to stay a quick homepage preview.
 */
function ResultTierGroup<T extends { college: College }>({
  tier,
  total,
  expanded,
  onToggle,
  exampleItems,
  fullItems,
  renderCard,
}: {
  tier: string;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  exampleItems: T[];
  fullItems: T[];
  renderCard: (item: T) => React.ReactNode;
}) {
  const [showAllInTier, setShowAllInTier] = useState(false);
  const canExpand = total > exampleItems.length;
  const items = expanded ? fullItems : exampleItems;
  const visible = expanded && !showAllInTier ? items.slice(0, TIER_GROUP_PAGE_SIZE) : items;

  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {tier}{" "}
          <span className="font-semibold normal-case text-slate-500">
            &middot; {ADMIT_TIER_RANGE[tier]} &middot; {total} school{total === 1 ? "" : "s"}
          </span>
        </h4>
        {canExpand && (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-[11px] font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
          >
            {expanded ? "Show fewer" : `See all ${total}`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">{visible.map(renderCard)}</div>
      {expanded && !showAllInTier && items.length > TIER_GROUP_PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAllInTier(true)}
          className="mt-3 text-xs font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
        >
          Show all {items.length} in this tier
        </button>
      )}
    </div>
  );
}

function ResultCard({
  college,
  interestsQuery,
  children,
}: {
  college: College;
  /** Carried to the school page so it can lead with the majors in what the student picked. */
  interestsQuery: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-sand-200 bg-sand-50 p-3 transition-colors hover:bg-sand-100">
      <div className="flex items-start justify-between gap-1.5">
        <SystemBadge system={college.system} />
        <SaveToggleButton collegeId={college.id} className="relative z-10" />
      </div>
      <h3 className="mt-2 text-[13px] font-bold leading-snug text-navy-900">
        <Link
          href={`/directory/${college.id}${interestsQuery ? `?interests=${interestsQuery}` : ""}`}
          className="after:absolute after:inset-0 group-hover:text-navy-700"
        >
          {college.name}
        </Link>
      </h3>
      {children}
      <p className="mt-2 text-[11px] text-slate-500">
        {formatPercent(displayedAdmitRate(college).value)} admit
      </p>
    </div>
  );
}
