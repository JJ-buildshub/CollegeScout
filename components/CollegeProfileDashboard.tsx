"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Briefcase, ExternalLink, MapPin } from "lucide-react";
import clsx from "clsx";
import type { College, FieldProvenance, ScorecardData } from "@/lib/types";
import { formatPercent, admitRateTier, displayedAdmitRate } from "@/lib/colleges";
import { hasReliableResidencySplit } from "@/lib/gpa";
import SystemBadge, { SYSTEM_ACCENT } from "./SystemBadge";
import SaveToggleButton from "./SaveToggleButton";
import TestingPolicyBadge from "./TestingPolicyBadge";
import ApplicationPlanBadges from "./ApplicationPlanBadges";
import FinancialSnapshot from "./FinancialSnapshot";
import CampusFitStats from "./CampusFitStats";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "admissions", label: "Admissions" },
  { id: "academics", label: "Academics" },
  { id: "cost", label: "Cost" },
  { id: "outcomes", label: "Outcomes" },
  { id: "campus", label: "Campus" },
];

// Offsets are tuned to this page's own sticky stack (site nav + this header,
// compacted + the section bar). Kept as constants so scroll-margin (used to
// keep anchor jumps from landing under the sticky stack) and the section
// bar's own sticky offset stay in sync if these ever change.
const NAV_HEIGHT = 68;
const HEADER_COMPACT_HEIGHT = 56;
const SECTION_BAR_TOP = NAV_HEIGHT + HEADER_COMPACT_HEIGHT;
const SCROLL_OFFSET = SECTION_BAR_TOP + 56;

export default function CollegeProfileDashboard({ college }: { college: College }) {
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const goBackToDirectory = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/directory");
    }
  };

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(top.target.id);
      },
      { rootMargin: `-${SECTION_BAR_TOP + 44}px 0px -60% 0px`, threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // CSU uses its own GPA calculation, not UC's, so it's treated like Private/
  // Out-of-State Public here (unweighted) rather than grouped with UC — see
  // the matching note on usesUcCappedMetric in lib/gpa.ts.
  const usesUcCapped = college.system === "UC";
  // A-G subject requirements genuinely are shared by UC and CSU, unlike the
  // GPA formula above, so this grouping is correct.
  const isUcOrCsu = college.system === "UC" || college.system === "CSU";
  const cappedGpaLabel =
    college.system === "CSU" ? "Mid-50% GPA (Capped, as reported)" : "Mid-50% UC-Capped GPA";
  const scrollMt = `scroll-mt-[${SCROLL_OFFSET}px]`;

  // Only UC/CSU schools report a capped-weighted figure at all — Private and
  // Out-of-State Public never do, so that box doesn't belong on their page.
  const gpaSatBoxes = [
    { label: "Mid-50% Unweighted GPA", value: college.mid50_GPA_Unweighted },
    ...(isUcOrCsu ? [{ label: cappedGpaLabel, value: college.mid50_GPA_UCCapped }] : []),
    { label: "Mid-50% SAT", value: college.mid50_SAT },
  ].filter((box) => hasReportedValue(box.value));

  // The "Overall" box shows whichever figure displayedAdmitRate() picks —
  // College Scorecard for every school it covers (all 125, as of the
  // Scorecard-as-default switch; see SCORECARD_VALIDATION.md), the curated
  // figure only as a fallback. In-State/Out-of-State only render for a
  // *reliable* split (hasReliableResidencySplit) — a school with no real
  // split has identical/missing figures there (redundant with Overall,
  // not real residency data), and a school whose split failed the
  // Scorecard consistency check has curated figures we no longer trust
  // enough to show as if they were.
  const admitRate = displayedAdmitRate(college);
  const showResidencySplit = hasReliableResidencySplit(college);
  const admitBoxes = [
    { label: "Overall", value: admitRate.value, provenance: admitRate.provenance ?? college.admissionsProvenance },
    ...(showResidencySplit
      ? [
          { label: "In-State", value: college.inStateAdmitRate, provenance: college.admissionsProvenance },
          { label: "Out-of-State", value: college.outOfStateAdmitRate, provenance: college.admissionsProvenance },
        ]
      : []),
  ].filter((box): box is { label: string; value: number; provenance: FieldProvenance | undefined } => box.value !== null);

  // Scorecard fills two glance stats we otherwise have no curated data for
  // at all (see commit 7694933, which dropped hardcoded "Not reported"
  // placeholders for these). Both are per-metric optional, so each renders
  // independently rather than as an all-or-nothing block.

  // Every sourced field on this page, in reading order, reduced to the
  // distinct labels — one footnote line each at the bottom of the page.
  const sourceNotes = Array.from(
    new Set(
      [
        admitRate.provenance ?? college.admissionsProvenance,
        college.gpaSatProvenance,
        college.outcomesProvenance,
        college.costProvenance,
        college.scorecard?.tuitionInState.provenance,
        college.scorecard?.tuitionOutOfState.provenance,
      ]
        .map(sourceLabel)
        .filter((label): label is string => label !== null)
    )
  );

  return (
    <SourceNotes.Provider value={sourceNotes}>
    <div>
      {/* Sticky school header, positioned below the site nav (68px). */}
      <div
        className={`sticky z-40 -mx-4 border-b border-black/10 px-4 transition-[padding] duration-200 sm:-mx-6 sm:px-6 ${SYSTEM_ACCENT[college.system].banner}`}
        style={{ top: NAV_HEIGHT, paddingTop: compact ? 8 : 16, paddingBottom: compact ? 8 : 16 }}
      >
        <div className="mx-auto max-w-5xl">
          {compact ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <SystemBadge system={college.system} />
                <h1 className="truncate text-sm font-bold text-white">{college.name}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <WebsiteButton website={college.website} compact />
                <SaveToggleButton collegeId={college.id} />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={goBackToDirectory}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
                </button>
                <div className="mt-1.5 text-xs font-bold tracking-wide text-white/90">{college.system}</div>
                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {college.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-white/90">
                  <MapPin className="h-3.5 w-3.5" /> {college.location}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <WebsiteButton website={college.website} />
                <SaveToggleButton collegeId={college.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* At-a-glance strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-semibold tracking-wide text-slate-600">Admit Rate</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-black tabular-nums leading-none tracking-tight text-navy-900">
                {Math.round(admitRate.value * 100)}
                <span className="text-2xl">%</span>
                <SourceMark provenance={admitRate.provenance ?? college.admissionsProvenance} />
              </span>
              <span className="text-xs font-semibold text-slate-500">{admitRateTier(admitRate.value)}</span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${Math.round(admitRate.value * 100)}% admit rate`}
            >
              <div
                className="h-full rounded-full bg-navy-800"
                style={{ width: `${Math.max(Math.round(admitRate.value * 100), 2)}%` }}
              />
            </div>
          </div>
          {hasReportedValue(usesUcCapped ? college.mid50_GPA_UCCapped : college.mid50_GPA_Unweighted) && (
            <GlanceStat
              label={usesUcCapped ? "GPA Range (UC-Capped)" : "GPA Range (Unweighted)"}
              value={usesUcCapped ? college.mid50_GPA_UCCapped : college.mid50_GPA_Unweighted}
              showSource
              provenance={college.gpaSatProvenance}
            />
          )}
          <GlanceStat
            label="Median Starting Salary"
            value={college.careerOutcomes.medianStartingSalary ?? "Not reported"}
            showSource
            provenance={college.outcomesProvenance}
          />
          {college.financials.coaInState !== null && (
            <GlanceStat
              label="Cost of Attendance"
              value={formatUsd(college.financials.coaInState)}
              sub={
                college.financials.coaOutOfState !== null &&
                college.financials.coaOutOfState !== college.financials.coaInState
                  ? `${formatUsd(college.financials.coaOutOfState)} out-of-state`
                  : "per year, before aid"
              }
            />
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold tracking-wide text-slate-600">Test Policy</div>
            <div className="mt-1.5">
              <TestingPolicyBadge policy={college.testingPolicy} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Data sourced from {college.dataProvenance.sourcedFrom.join(", ")}
          {college.dataProvenance.lastVerified ? ` · Last verified ${college.dataProvenance.lastVerified}` : ""}.
          This provenance applies to the record as a whole
          {sourceNotes.length > 0 &&
            " — figures marked with a star are sourced separately, as noted at the bottom of the page"}
          .
        </p>

        {/* Sticky section bar */}
        <nav
          className="sticky z-30 -mx-4 mt-4 overflow-x-auto border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6"
          style={{ top: SECTION_BAR_TOP }}
        >
          <div className="flex gap-1 py-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  activeId === s.id ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-10 py-6">
          {/* Overview */}
          <section id="overview" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Overview</h2>
            <div className="mt-3 w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div>
                <div className="text-xs font-bold tracking-wide text-slate-600">
                  Helpful high school preparation
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {college.idealStudentArchetype.highSchoolCoursePrereqs.map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-2 max-w-prose text-xs text-slate-400">
                  This is helpful preparation, not a formal admission requirement.
                  {isUcOrCsu &&
                    " For UC and CSU schools, admission is based on completing the A-G course requirements, not this list."}
                </p>
              </div>
            </div>
          </section>

          {/* Admissions */}
          <section id="admissions" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Admissions</h2>
            <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
              <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className={`grid gap-4 ${GRID_COLS_CLASS[admitBoxes.length]}`}>
                  {admitBoxes.map((box) => (
                    <Stat
                      key={box.label}
                      label={box.label}
                      value={formatPercent(box.value)}
                      showSource
                      provenance={box.provenance}
                    />
                  ))}
                </div>
                {admitRate.superseded && (
                  <p className="mt-2 text-[11px] leading-snug text-slate-400">
                    {showResidencySplit
                      ? "Overall is College Scorecard's verified figure and won't necessarily sit between the separately-reported In-State/Out-of-State rates shown here, which are what Find My Fit uses to classify your chances."
                      : "Find My Fit uses this overall rate to classify your chances here."}
                  </p>
                )}
                {gpaSatBoxes.length > 0 ? (
                  <div className={`mt-4 grid gap-4 border-t border-slate-100 pt-4 ${GRID_COLS_CLASS[gpaSatBoxes.length]}`}>
                    {gpaSatBoxes.map((box) => (
                      <GpaBox
                        key={box.label}
                        label={box.label}
                        value={box.value}
                        showSource
                        provenance={college.gpaSatProvenance}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                    GPA and test score ranges aren&apos;t reported for this school.
                  </p>
                )}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <TestingPolicyBadge policy={college.testingPolicy} />
                </div>
              </div>

              <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="text-xs font-bold tracking-wide text-slate-600">
                  Application Deadlines
                </div>
                <div className="mt-2">
                  <ApplicationPlanBadges plans={college.applicationPlans} />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold tracking-wide text-slate-600">Impacted Majors</div>
                  {college.impactedMajors.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {college.impactedMajors.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No internally-impacted majors reported.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Academics */}
          <section id="academics" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Academics</h2>
            <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
              <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gold-600" />
                  <h3 className="text-sm font-bold text-navy-900">Flagship Programs</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {college.flagshipPrograms.map((p) => (
                    <span key={p.name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <h3 className="text-sm font-bold text-navy-900">Career &amp; Major Pathways</h3>
                <div className="mt-4">
                  <div className="text-xs font-bold tracking-wide text-slate-600">Primary Disciplines</div>
                  {college.careerMajorTags.primaryDisciplines.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {college.careerMajorTags.primaryDisciplines.map((d) => (
                        <span key={d} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Not publicly reported.</p>
                  )}
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold tracking-wide text-slate-600">
                    Interdisciplinary Pathways
                  </div>
                  {college.careerMajorTags.interdisciplinaryPathways.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {college.careerMajorTags.interdisciplinaryPathways.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-600 ring-1 ring-inset ring-gold-500/20"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">None documented yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Cost */}
          <section id="cost" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Cost</h2>
            <div className="mt-3">
              <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <FinancialSnapshot
                  financials={college.financials}
                  ipedsUnitId={college.ipedsUnitId ?? null}
                  sourceMark={<SourceMark provenance={college.costProvenance} />}
                />
                {college.scorecard && <ScorecardTuitionRow scorecard={college.scorecard} />}
              </div>
            </div>
          </section>

          {/* Outcomes */}
          <section id="outcomes" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Outcomes</h2>
            <div className="mt-3 w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gold-600" />
                <h3 className="text-sm font-bold text-navy-900">Career Outcomes</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat
                  label="Placement Rate"
                  value={college.careerOutcomes.placementRate}
                  showSource
                  provenance={college.outcomesProvenance}
                />
                <Stat
                  label="Median Starting Salary"
                  value={college.careerOutcomes.medianStartingSalary}
                  showSource
                  provenance={college.outcomesProvenance}
                />
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="text-xs font-bold tracking-wide text-slate-600">Top Recruiters</div>
                {college.careerOutcomes.topRecruiters.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {college.careerOutcomes.topRecruiters.map((r) => (
                      <span key={r} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Not publicly reported.</p>
                )}
              </div>
            </div>
          </section>

          {/* Campus */}
          <section id="campus" className={scrollMt}>
            <h2 className="text-lg font-bold text-navy-900">Campus</h2>
            <div className="mt-3 w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-bold text-navy-900">Campus Fit</h3>
              <div className="mt-4">
                <CampusFitStats fit={college.campusFit} />
              </div>
            </div>
          </section>
        </div>

        {sourceNotes.length > 0 && (
          <div className="space-y-1 border-t border-slate-200 pb-8 pt-4 text-xs text-slate-400">
            {sourceNotes.map((note, i) => (
              <p key={note}>
                <span className="mr-1 font-bold">{FOOTNOTE_MARKS[Math.min(i, FOOTNOTE_MARKS.length - 1)]}</span>
                {note.replace(/^College Scorecard/, "College Scorecard (U.S. Department of Education)")}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
    </SourceNotes.Provider>
  );
}

function WebsiteButton({ website, compact }: { website: string | null; compact?: boolean }) {
  if (!website) return null;
  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-semibold text-navy-900 hover:border-slate-300",
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
      )}
    >
      Visit website <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

/** Strips a technical field-name suffix like " (latest.cost.avg_net_price.overall)" — useful for our own audit trail in the data file, but not something a reader needs to see. */
function readableSource(source: string): string {
  return source.replace(/\s*\([^)]*\)\s*$/, "");
}

/**
 * The "{source} · {year}" label for a field, or null when we have neither
 * (true for most curated fields today — showing "Source not recorded" on
 * every stat reads as a broken page rather than an honest one; the
 * page-wide note near the top covers those). Once either half is known, the
 * missing half is still labeled explicitly rather than silently dropped.
 */
function sourceLabel(provenance?: FieldProvenance | null): string | null {
  if (!provenance?.source && !provenance?.year) return null;
  const source = provenance?.source ? readableSource(provenance.source) : "Source not recorded";
  const year = provenance?.year ?? "Year not recorded";
  return `${source} \u00b7 ${year}`;
}

// Footnote symbols, in order of first appearance on the page. Most profiles
// have a single source (College Scorecard, one award year), so the reader
// usually sees just "*".
const FOOTNOTE_MARKS = ["*", "\u2020", "\u2021", "\u00a7"];

// The page's distinct sourced-field labels, in order. Each starred value looks
// itself up here so the marker matches the single footnote at the page bottom.
const SourceNotes = createContext<string[]>([]);

/**
 * A small superscript marker next to a sourced value — the full source is on
 * hover (title) and for screen readers, and spelled out once in the page
 * footnote instead of under every field.
 */
function SourceMark({ provenance }: { provenance?: FieldProvenance | null }) {
  const notes = useContext(SourceNotes);
  const label = sourceLabel(provenance);
  if (!label) return null;
  const index = notes.indexOf(label);
  if (index === -1) return null;
  return (
    <sup className="ml-0.5 text-xs font-bold text-slate-500" title={label}>
      {FOOTNOTE_MARKS[Math.min(index, FOOTNOTE_MARKS.length - 1)]}
      <span className="sr-only"> (source: {label})</span>
    </sup>
  );
}

/** "N/A (...)"-style placeholder strings mean the field isn't reported — never render an empty box for one. */
function hasReportedValue(value: string): boolean {
  return !value.trim().toUpperCase().startsWith("N/A");
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString()}`;
}

const GRID_COLS_CLASS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

function GlanceStat({
  label,
  value,
  sub,
  showSource,
  provenance,
}: {
  label: string;
  value: string;
  sub?: string;
  showSource?: boolean;
  provenance?: FieldProvenance;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-semibold tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-base font-extrabold tabular-nums text-navy-900">
        {value}
        {showSource && <SourceMark provenance={provenance} />}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

function Stat({
  label,
  value,
  showSource,
  provenance,
}: {
  label: string;
  value: string | null;
  showSource?: boolean;
  provenance?: FieldProvenance;
}) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-navy-900">
        {value ?? "Not publicly reported"}
        {showSource && <SourceMark provenance={provenance} />}
      </div>
    </div>
  );
}


/**
 * Tuition is the one Scorecard cost figure kept on the profile: a real, dated
 * component of the cost of attendance above, shown with its own source line.
 * (Net price and net price by income were removed from the profile.)
 */
function ScorecardTuitionRow({ scorecard }: { scorecard: ScorecardData }) {
  const { tuitionInState, tuitionOutOfState } = scorecard;
  if (tuitionInState.value == null && tuitionOutOfState.value == null) return null;
  const sameTuition = tuitionInState.value != null && tuitionInState.value === tuitionOutOfState.value;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="text-xs font-semibold tracking-wide text-slate-600">
        Tuition only (part of the cost above)
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-slate-500">
          {sameTuition ? "Tuition" : "In-state"}{" "}
          <span className="font-bold tabular-nums text-navy-900">
            {tuitionInState.value != null ? formatUsd(tuitionInState.value) : "Not reported"}
          </span>
          <SourceMark provenance={tuitionInState.provenance} />
        </span>
        {!sameTuition && (
          <span className="text-slate-500">
            Out-of-state{" "}
            <span className="font-bold tabular-nums text-navy-900">
              {tuitionOutOfState.value != null ? formatUsd(tuitionOutOfState.value) : "Not reported"}
            </span>
            <SourceMark provenance={tuitionOutOfState.provenance} />
          </span>
        )}
      </div>
    </div>
  );
}

function GpaBox({
  label,
  value,
  showSource,
  provenance,
}: {
  label: string;
  value: string;
  showSource?: boolean;
  provenance?: FieldProvenance;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-semibold tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-base font-bold text-navy-900">
        {value}
        {showSource && <SourceMark provenance={provenance} />}
      </div>
    </div>
  );
}
