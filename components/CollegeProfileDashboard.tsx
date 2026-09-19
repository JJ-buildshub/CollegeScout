"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Briefcase, ExternalLink, MapPin } from "lucide-react";
import clsx from "clsx";
import type { College, FieldProvenance, ScorecardData } from "@/lib/types";
import { formatPercent, admitRateTier } from "@/lib/colleges";
import { hasResidencySplit } from "@/lib/gpa";
import SystemBadge from "./SystemBadge";
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

  // Labeled "(as reported)" — not because it's doubted more than any other
  // curated figure, but specifically to sit next to the College Scorecard
  // admit rate below without the two looking like a contradiction: they're
  // two different overall figures from two different sources/years, not a
  // page disagreeing with itself.
  const admitBoxes = [
    { label: "Overall (as reported)", value: college.admitRateOverall },
    { label: "In-State", value: college.inStateAdmitRate },
    { label: "Out-of-State", value: college.outOfStateAdmitRate },
  ].filter((box): box is { label: string; value: number } => box.value !== null);
  const scorecardAdmitRate = college.scorecard?.admitRateOverall;

  // Scorecard fills two glance stats we otherwise have no curated data for
  // at all (see commit 7694933, which dropped hardcoded "Not reported"
  // placeholders for these). Both are per-metric optional, so each renders
  // independently rather than as an all-or-nothing block.
  const netPrice = college.scorecard?.netPriceOverall;
  const gradRate = college.scorecard?.graduationRate;

  return (
    <div>
      {/* Sticky school header, positioned below the site nav (68px). */}
      <div
        className="sticky z-40 -mx-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-[padding] duration-200 sm:-mx-6 sm:px-6"
        style={{ top: NAV_HEIGHT, paddingTop: compact ? 8 : 16, paddingBottom: compact ? 8 : 16 }}
      >
        <div className="mx-auto max-w-5xl">
          {compact ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <SystemBadge system={college.system} />
                <h1 className="truncate text-sm font-bold text-navy-900">{college.name}</h1>
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
                </button>
                <div className="mt-1.5">
                  <SystemBadge system={college.system} />
                </div>
                <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
                  {college.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
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
          <GlanceStat
            label="Admit Rate"
            value={formatPercent(college.admitRateOverall)}
            sub={admitRateTier(college.admitRateOverall)}
            showSource
            provenance={college.admissionsProvenance}
          />
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
          {netPrice?.value != null && (
            <GlanceStat
              label="Net Price"
              value={formatUsd(netPrice.value)}
              sub="avg., via College Scorecard"
              showSource
              provenance={netPrice.provenance ?? undefined}
            />
          )}
          {gradRate?.value != null && (
            <GlanceStat
              label="Graduation Rate"
              value={formatPercent(gradRate.value)}
              sub="6-yr., via College Scorecard"
              showSource
              provenance={gradRate.provenance ?? undefined}
            />
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Test Policy</div>
            <div className="mt-1.5">
              <TestingPolicyBadge policy={college.testingPolicy} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Data sourced from {college.dataProvenance.sourcedFrom.join(", ")}
          {college.dataProvenance.lastVerified ? ` · Last verified ${college.dataProvenance.lastVerified}` : ""}.
          This provenance applies to the record as a whole
          {(netPrice?.value != null || gradRate?.value != null) &&
            " — Net Price and Graduation Rate are sourced separately from College Scorecard, as noted on each"}
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
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
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
                      provenance={college.admissionsProvenance}
                    />
                  ))}
                </div>
                {scorecardAdmitRate?.value != null && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Overall (College Scorecard, verified)
                      </div>
                      <div className="text-base font-bold text-navy-900">
                        {formatPercent(scorecardAdmitRate.value)}
                      </div>
                    </div>
                    <SourceLine provenance={scorecardAdmitRate.provenance ?? undefined} className="mt-1" />
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                      {hasResidencySplit(college)
                        ? "This is an overall figure and won't match the in-state/out-of-state rates above, which reflect your specific residency rather than the whole applicant pool."
                        : "This school doesn't report a residency split, so this verified overall rate is also what Find My Fit uses to classify your chances here — it may differ from the school-reported figure above, which comes from a different source/year."}
                    </p>
                  </div>
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
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Application Deadlines
                </div>
                <div className="mt-2">
                  <ApplicationPlanBadges plans={college.applicationPlans} />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Impacted Majors</div>
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
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Primary Disciplines</div>
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
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
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
            <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
              <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <FinancialSnapshot financials={college.financials} />
                <SourceLine provenance={college.costProvenance} className="mt-3" />
              </div>
              {college.scorecard && <ScorecardCostCard scorecard={college.scorecard} />}
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
                {gradRate?.value != null && (
                  <Stat
                    label="Graduation Rate (6-yr., via College Scorecard)"
                    value={formatPercent(gradRate.value)}
                    showSource
                    provenance={gradRate.provenance ?? undefined}
                  />
                )}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Top Recruiters</div>
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
      </div>
    </div>
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
        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 font-semibold text-navy-900 hover:border-slate-300",
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
      )}
    >
      Visit website <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

/**
 * Renders "{source} · {year}" — but only once we actually have a source or a
 * year for this field. Showing "Source not recorded · Year not recorded" on
 * every stat (true for all 125 records today, since no field has provenance
 * populated yet) reads as a broken page rather than an honest one; once
 * either half is known, still label the missing half explicitly rather than
 * silently dropping it.
 */
/** Strips a technical field-name suffix like " (latest.cost.avg_net_price.overall)" — useful for our own audit trail in the data file, but not something a reader needs to see. */
function readableSource(source: string): string {
  return source.replace(/\s*\([^)]*\)\s*$/, "");
}

function SourceLine({ provenance, className }: { provenance?: FieldProvenance; className?: string }) {
  if (!provenance?.source && !provenance?.year) return null;
  const source = provenance?.source ? readableSource(provenance.source) : "Source not recorded";
  const year = provenance?.year ?? "Year not recorded";
  return <div className={clsx("text-[11px] text-slate-400", className)}>{source} &middot; {year}</div>;
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
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-bold text-navy-900">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
      {showSource && <SourceLine provenance={provenance} className="mt-1" />}
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
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-navy-900">{value ?? "Not publicly reported"}</div>
      {showSource && <SourceLine provenance={provenance} className="mt-1" />}
    </div>
  );
}

const INCOME_BAND_LABELS: Record<string, string> = {
  "0-30000": "$0 – 30,000",
  "30001-48000": "$30,001 – 48,000",
  "48001-75000": "$48,001 – 75,000",
  "75001-110000": "$75,001 – 110,000",
  "110001-plus": "$110,001+",
};
const INCOME_BAND_ORDER = Object.keys(INCOME_BAND_LABELS);

/**
 * A second, clearly separate card for College Scorecard's cost figures — kept
 * apart from the curated FinancialSnapshot card rather than merged into it,
 * since Scorecard's tuition figure is tuition only (not full cost of
 * attendance) and its net price is a different methodology/reporting year
 * than any curated cost figure. Never rendered as a stand-in for curated
 * data, only as an additional, separately-sourced reference.
 */
function ScorecardCostCard({ scorecard }: { scorecard: ScorecardData }) {
  const { tuitionInState, tuitionOutOfState, netPriceOverall, netPriceByIncomeBand } = scorecard;
  const sameTuition =
    tuitionInState.value != null && tuitionInState.value === tuitionOutOfState.value;
  const bands = netPriceByIncomeBand.value
    ? INCOME_BAND_ORDER.filter((band) => netPriceByIncomeBand.value![band] != null)
    : [];

  if (tuitionInState.value == null && tuitionOutOfState.value == null && netPriceOverall.value == null) {
    return null;
  }

  return (
    <div className="w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Via College Scorecard</div>
      <p className="mt-1 text-xs text-slate-400">
        Tuition only (not full cost of attendance) and average net price — a separate source/methodology from
        the curated figures at left.
      </p>
      {(tuitionInState.value != null || tuitionOutOfState.value != null) && (
        <div className={`mt-4 grid gap-4 border-t border-slate-100 pt-4 ${sameTuition ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {sameTuition ? "Tuition" : "In-State Tuition"}
            </div>
            <div className="mt-0.5 text-lg font-bold text-navy-900">
              {tuitionInState.value != null ? formatUsd(tuitionInState.value) : "Not reported"}
            </div>
          </div>
          {!sameTuition && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Out-of-State Tuition</div>
              <div className="mt-0.5 text-lg font-bold text-navy-900">
                {tuitionOutOfState.value != null ? formatUsd(tuitionOutOfState.value) : "Not reported"}
              </div>
            </div>
          )}
        </div>
      )}
      <SourceLine
        provenance={tuitionInState.provenance ?? tuitionOutOfState.provenance ?? undefined}
        className="mt-1"
      />
      {netPriceOverall.value != null && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Average Net Price</div>
          <div className="mt-0.5 text-lg font-bold text-navy-900">{formatUsd(netPriceOverall.value)}</div>
          <SourceLine provenance={netPriceOverall.provenance ?? undefined} className="mt-1" />
        </div>
      )}
      {bands.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Net Price by Family Income</div>
          <div className="mt-2 space-y-1">
            {bands.map((band) => (
              <div key={band} className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500">{INCOME_BAND_LABELS[band]}</span>
                <span className="font-semibold text-navy-900">{formatUsd(netPriceByIncomeBand.value![band])}</span>
              </div>
            ))}
          </div>
          <SourceLine provenance={netPriceByIncomeBand.provenance ?? undefined} className="mt-2" />
        </div>
      )}
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
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-base font-bold text-navy-900">{value}</div>
      {showSource && <SourceLine provenance={provenance} className="mt-1" />}
    </div>
  );
}
