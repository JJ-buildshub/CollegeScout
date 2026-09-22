export type CollegeSystem = "UC" | "CSU" | "Private" | "Public";

/** "Not verified" means the school's own page has not been read yet; never a guess at the policy. */
export type TestingPolicy = "Test-Free" | "Test-Required" | "Test-Optional" | "Test-Blind" | "Not verified";

export interface FlagshipProgram {
  name: string;
  ranking: string;
  selectivityNote: string;
}

export interface CareerOutcomes {
  placementRate: string | null;
  medianStartingSalary: string | null;
  topRecruiters: string[];
}

export interface IdealStudentArchetype {
  profileSummary: string;
  highSchoolCoursePrereqs: string[];
  highImpactSpikes: string[];
}

/**
 * "Unspecified" covers legacy/not-yet-verified records where an early plan
 * date is known but whether it's binding ED or non-binding EA hasn't been
 * confirmed against a primary source yet — never guess binding status.
 */
export type ApplicationPlanType = "ED" | "ED2" | "EA" | "EA2" | "REA" | "RD" | "Rolling" | "Unspecified";

export interface ApplicationPlan {
  type: ApplicationPlanType;
  binding: boolean | null;
  deadline: string | null;
  /** Context that must not be mistaken for the plan's own deadline, e.g. "The freshman scholarship deadline is a separate date: December 1." */
  note?: string;
}

export interface FinancialSnapshot {
  coaInState: number | null;
  coaOutOfState: number | null;
  netPriceCalculatorUrl: string | null;
  /** Interpretive counseling note, not a verified figure. */
  meritAidNote: string | null;
}

export type CampusSetting = "Urban" | "Suburban" | "Small City" | "Rural";

export interface CampusFitAttributes {
  undergradEnrollment: number | null;
  setting: CampusSetting | null;
  greekLifePercent: number | null;
  percentLivingOnCampus: number | null;
}

export interface CareerMajorTags {
  primaryDisciplines: string[];
  interdisciplinaryPathways: string[];
}

export type DataSource =
  | "CDS"
  | "IPEDS"
  | "College Scorecard"
  | "Common Data Set (Institutional)"
  | "Institutional Website";

export interface DataProvenance {
  sourcedFrom: DataSource[];
  lastVerified: string | null;
}

/**
 * Per-datapoint provenance, distinct from the whole-record `DataProvenance`
 * above. Optional and currently unpopulated for every school — the dataset
 * only tracks source/verification at the whole-record level today, not per
 * field, so these should only ever be filled in from a specific, citable
 * source for that exact figure. Never infer one from the record-level
 * `dataProvenance.sourcedFrom` array, since a school reporting from multiple
 * sources (e.g. CDS + Institutional Website) doesn't tell you which source
 * backs which individual number.
 */
export interface FieldProvenance {
  source?: string;
  year?: string;
  /** ISO date the source page was read, when the record was checked against a school page. */
  accessed?: string;
  /** Anything a reader should know about how the record was verified. */
  note?: string;
}

export interface College {
  id: string;
  name: string;
  system: CollegeSystem;
  /** Curated ordering for the original schools only; schools added later have none. */
  rank?: number;
  location: string;
  /**
   * Two-letter USPS state code (or "DC"), derived once from `location` via
   * lib/states.ts and required for every record — used to compare against a
   * visitor's stored home state (see lib/states.ts) for residency/cost/label
   * personalization. Don't parse `location` for this elsewhere; it's free
   * text with inconsistent formatting (full names, abbreviations, and city
   * suffixes all appear there).
   */
  state: string;
  /** Official homepage URL, checked against redirects/HTTP failures via scripts/check-college-websites.mjs. */
  website: string | null;
  /**
   * The curated figure, preserved for history — never overwritten or
   * deleted when a more trustworthy source supersedes it for display. See
   * `admitRateOverallSuperseded` and `lib/colleges.ts`'s
   * `displayedAdmitRate`, which is what every UI surface should call
   * instead of reading this field directly.
   */
  admitRateOverall: number;
  /**
   * True once College Scorecard's admit rate has taken over as the
   * displayed figure for this school (set for all 125 as of the
   * Scorecard-as-display-default switch — see SCORECARD_VALIDATION.md for
   * why). `admitRateOverall` above is left untouched when this is true;
   * only which number gets shown changes.
   */
  admitRateOverallSuperseded?: boolean;
  /**
   * null when the school doesn't publicly report an admit rate split by
   * residency. `outOfStateAdmitRate` means domestic non-resident
   * specifically, never blended with international — see
   * DATA_METHODOLOGY.md for why and how to apply this when sourcing.
   */
  inStateAdmitRate: number | null;
  outOfStateAdmitRate: number | null;
  /**
   * True when a real curated in-state/out-of-state split failed a
   * consistency check against College Scorecard's overall rate (outside
   * the curated [min(in,out), max(in,out)] range by more than ~3 points —
   * see the "consistency check for the 39 split schools" commit) and is no
   * longer treated as reliable. `inStateAdmitRate`/`outOfStateAdmitRate`
   * are left untouched for history; this only marks that lib/gpa.ts's
   * `hasReliableResidencySplit` and profile display should treat the
   * school as if it had no split — see `admitRateOverallSuperseded` for
   * the parallel marker on the overall figure.
   */
  admitRateSplitSuperseded?: boolean;
  testingPolicy: TestingPolicy;
  mid50_GPA_Unweighted: string;
  /**
   * For UC schools, the official UC-capped weighted GPA range. For CSU
   * schools, a capped/weighted figure as reported by the institution — not
   * confirmed to use the same formula as UC's (CSU has its own GPA
   * calculation). Treat CSU values here as "as reported," not UC-equivalent.
   */
  mid50_GPA_UCCapped: string;
  mid50_SAT: string;
  impactedMajors: string[];
  flagshipPrograms: FlagshipProgram[];
  careerOutcomes: CareerOutcomes;
  campusCultureAndVibe: string;
  idealStudentArchetype: IdealStudentArchetype;
  applicationPlans: ApplicationPlan[];
  financials: FinancialSnapshot;
  campusFit: CampusFitAttributes;
  careerMajorTags: CareerMajorTags;
  dataProvenance: DataProvenance;
  /** Source/year for admitRateOverall, inStateAdmitRate, outOfStateAdmitRate. Unpopulated until researched. */
  admissionsProvenance?: FieldProvenance;
  /** Source/year for mid50_GPA_Unweighted, mid50_GPA_UCCapped, mid50_SAT. Unpopulated until researched. */
  gpaSatProvenance?: FieldProvenance;
  /** Source/year for financials.coaInState / coaOutOfState. Unpopulated until researched. */
  costProvenance?: FieldProvenance;
  /** Source/year for applicationPlans; set only when the whole list is backed by that source (see scripts/sync-plans-from-commonapp.py). */
  applicationPlansProvenance?: FieldProvenance;
  /** Source for testingPolicy when it was confirmed against the school's own page. */
  testingPolicyProvenance?: FieldProvenance;
  /** Scope or exceptions for testingPolicy, e.g. "Columbus campus" or "A hardship waiver is available." */
  testingPolicyNote?: string;
  /** Source/year for careerOutcomes.placementRate / medianStartingSalary. Unpopulated until researched. */
  outcomesProvenance?: FieldProvenance;
  /**
   * College Scorecard's IPEDS unit ID for this school — the crosswalk key
   * used by scripts/import-scorecard.mjs to re-fetch `scorecard` data without
   * re-matching by name/state each time. Only set once a match was confident
   * enough to record (see QUESTIONS.md for schools that couldn't be matched).
   */
  ipedsUnitId?: number | null;
  /**
   * Data pulled from the College Scorecard API, kept entirely separate from
   * the hand-curated fields above so an import can never silently overwrite
   * curated data (see scripts/import-scorecard.mjs). Each metric carries its
   * own value/provenance pair rather than sharing one record-level source,
   * since fields are fetched independently and can come from different
   * reporting years. `null` value means Scorecard didn't report it for this
   * school; a missing `scorecard` object entirely means no confident IPEDS
   * match was found.
   */
  scorecard?: ScorecardData;
}

/** One imported value paired with where/when it came from — `null` provenance means the value itself is also null (never reported). */
export interface ScorecardMetric {
  value: number | null;
  provenance: FieldProvenance | null;
}

/** Same pairing as ScorecardMetric, but for net price broken out by family income band (Scorecard reports this as a small set of bands, not a continuous figure). */
export interface ScorecardIncomeBandMetric {
  /** Keyed by Scorecard's own income-band strings, e.g. "0-30000", "110001-plus". */
  value: Record<string, number> | null;
  provenance: FieldProvenance | null;
}

export interface ScorecardData {
  netPriceOverall: ScorecardMetric;
  netPriceByIncomeBand: ScorecardIncomeBandMetric;
  /** 6-year completion rate (150% of normal time) — the standard "graduation rate" figure Scorecard/IPEDS report for 4-year institutions. */
  graduationRate: ScorecardMetric;
  undergradEnrollment: ScorecardMetric;
  /**
   * Tuition only, not full cost of attendance — Scorecard doesn't publish
   * room/board/etc. split by residency, only tuition. Don't compare directly
   * against `financials.coaInState`/`coaOutOfState`, which include the rest
   * of COA; see REPORT.md.
   */
  tuitionInState: ScorecardMetric;
  tuitionOutOfState: ScorecardMetric;
  /**
   * The displayed admit rate for this school as of the Scorecard-as-default
   * switch (see `displayedAdmitRate` in lib/colleges.ts) — validated
   * against UC's own released figures within ~1 point for 6 campuses
   * checked (SCORECARD_VALIDATION.md) before making it the default.
   * Also — since the partial Matcher switch — the classification input
   * itself for schools with no real curated residency split
   * (lib/gpa.ts's hasResidencySplit). Schools with a real split keep the
   * curated, residency-aware figures for classification; this Scorecard
   * figure has no residency breakdown at all, so it can't replace those.
   */
  admitRateOverall: ScorecardMetric;
}

export type FitCategory = "Safety" | "Target" | "Reach" | "Unrated";

/** A real Safety/Target/Reach placement — never "Unrated" itself. */
export type AdmitRateLean = "Safety" | "Target" | "Reach";

export type ResidencyContext = "in-state" | "out-of-state" | "overall";

export interface FitResult {
  college: College;
  /** "Unrated" when the school doesn't publish a GPA band — never a real Safety/Target/Reach placement without one. */
  category: FitCategory;
  studentGpaUsed: number;
  gpaMetricLabel: string;
  /** null when the school doesn't publicly report a GPA band — classification fell back to admit rate alone. */
  rangeLow: number | null;
  rangeHigh: number | null;
  reason: string;
  /** Which admit rate was actually used for classification. */
  residencyContext: ResidencyContext;
  /**
   * Set only when the student's SAT score was actually part of this result
   * (see evaluateCollegeFit for when a score is used or deliberately ignored).
   */
  sat: { score: number; low: number; high: number } | null;
  /** Plain-language note when a score was deliberately left out (e.g. below range at a test-optional school). */
  satNote: string | null;
  /** Where the driving value (GPA or SAT) sat relative to the published range — null when there was no range to compare against at all. */
  band: "below" | "within" | "above" | null;
  /** True when category came from admit rate alone because the school publishes no GPA range — always shown labeled "Estimated." */
  isEstimated: boolean;
}

export type Grade = 9 | 10 | 11 | 12;

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
}
