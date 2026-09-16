export type CollegeSystem = "UC" | "CSU" | "Private" | "Out-of-State Public";

export type TestingPolicy = "Test-Free" | "Test-Required" | "Test-Optional" | "Test-Blind";

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
export type ApplicationPlanType = "ED" | "ED2" | "EA" | "REA" | "RD" | "Rolling" | "Unspecified";

export interface ApplicationPlan {
  type: ApplicationPlanType;
  binding: boolean | null;
  deadline: string | null;
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
}

export interface College {
  id: string;
  name: string;
  system: CollegeSystem;
  rank: number;
  location: string;
  /** Official homepage URL, checked against redirects/HTTP failures via scripts/check-college-websites.mjs. */
  website: string | null;
  admitRateOverall: number;
  /** null when the school doesn't publicly report an admit rate split by residency. */
  inStateAdmitRate: number | null;
  outOfStateAdmitRate: number | null;
  testingPolicy: TestingPolicy;
  mid50_GPA_Unweighted: string;
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
  /** Source/year for careerOutcomes.placementRate / medianStartingSalary. Unpopulated until researched. */
  outcomesProvenance?: FieldProvenance;
}

export type FitCategory = "Safety" | "Target" | "Reach" | "Unrated";

/** A real Safety/Target/Reach lean — never "Unrated" itself. */
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
  /** Set only when category is "Unrated" — the rough admit-rate-only lean, shown as an estimate, not a placement. */
  admitRateOnlyLean: AdmitRateLean | null;
  /** Which admit rate was actually used for classification. */
  residencyContext: ResidencyContext;
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
