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

export interface College {
  id: string;
  name: string;
  system: CollegeSystem;
  rank: number;
  location: string;
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
}

export type FitCategory = "Safety" | "Target" | "Reach";

export interface FitResult {
  college: College;
  category: FitCategory;
  studentGpaUsed: number;
  gpaMetricLabel: string;
  /** null when the school doesn't publicly report a GPA band — classification fell back to admit rate alone. */
  rangeLow: number | null;
  rangeHigh: number | null;
  reason: string;
}

export type Grade = 9 | 10 | 11;

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
