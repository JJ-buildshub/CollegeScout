import type { ApplicationPlanType, College } from "./types";
import { getApplicationInfo } from "./applications";
import { COMMON_APP_SOURCE, getCommonAppFacts } from "./commonapp";
import { getSystemRequirements } from "./systemRequirements";

export interface OverviewRow {
  label: string;
  text: string;
  source: { label: string; url: string };
}

const PLAN_LABELS: Record<ApplicationPlanType, string> = {
  ED: "Early Decision",
  ED2: "Early Decision II",
  EA: "Early Action",
  EA2: "Early Action II",
  REA: "Restrictive Early Action",
  RD: "Regular Decision",
  Rolling: "Rolling admission",
  Unspecified: "Early plan",
};

// The grid's test policy codes, worded as the grid's own legend words them.
const TEST_CODE_TEXT: Record<string, string> = {
  A: "Test scores are always required.",
  F: "Test-flexible: the school accepts several options, so check its site.",
  I: "Test scores are ignored.",
  N: "Test scores are never required.",
  S: "Test scores are sometimes required.",
};

// Which of our curated test policies is consistent with each grid code. Where
// they disagree we say nothing here rather than pick a side (the disagreement
// is being reviewed), so the two can never contradict each other on a page.
const TEST_CODE_CONSISTENT: Record<string, string[]> = {
  A: ["Test-Required"],
  F: ["Test-Optional", "Test-Required"],
  I: ["Test-Blind", "Test-Free"],
  N: ["Test-Optional", "Test-Free", "Test-Blind"],
  S: ["Test-Optional", "Test-Required"],
};

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * The plain-language "how admission works here" rows for a school. A row only
 * exists when it rests on a real source (a system's own pages, the Common App
 * requirements grid, or a school page we read); nothing is filled in from
 * curated, unsourced data, and blanks in the grid are never turned into "no".
 */
export function buildAdmissionOverview(college: College): OverviewRow[] {
  const rows: OverviewRow[] = [];
  const grid = { label: "Common App requirements grid", url: COMMON_APP_SOURCE.url };
  const facts = getCommonAppFacts(college.id);
  const info = getApplicationInfo(college.id);
  const system = college.system === "UC" || college.system === "CSU" ? getSystemRequirements(college.system) : null;

  // Where you apply
  if (facts) {
    rows.push({ label: "Where you apply", text: "The Common App.", source: grid });
  } else if (info && info.platforms.length > 0) {
    rows.push({ label: "Where you apply", text: info.platforms.join(" or ") + ".", source: { label: "School admissions page", url: info.source.url } });
  }

  // Test scores: the system's own statement, else the grid (when it agrees with our data)
  const systemTest = system?.overview.find((r) => r.label === "Test scores");
  if (system && systemTest) {
    rows.push({ label: systemTest.label, text: systemTest.text, source: { label: system.title.split(" ")[0] + " admissions site", url: system.sources[systemTest.source] } });
  } else if (facts?.testPolicyCode && TEST_CODE_TEXT[facts.testPolicyCode]) {
    if (TEST_CODE_CONSISTENT[facts.testPolicyCode].includes(college.testingPolicy)) {
      rows.push({ label: "Test scores", text: TEST_CODE_TEXT[facts.testPolicyCode], source: grid });
    }
  }

  // System rules (UC, CSU): GPA levels and which grades count, guarantees, residency, local admission, impaction
  if (system) {
    const name = system.title.split(" ")[0];
    for (const row of system.overview) {
      if (row.label === "Test scores") continue;
      rows.push({ label: row.label, text: row.text, source: { label: `${name} admissions site`, url: system.sources[row.source] } });
    }
  }

  // Essays
  if (info) {
    // "3 required" / "Answer 4 of these 8" say how many to write; other notes aren't repeated here.
    const describe = (w: (typeof info.requiredWriting)[number]): string => {
      const count = w.note && /required|answer/i.test(w.note) ? w.note.replace(/\.$/, "").replace(/^Answer/, "answer") : null;
      const head = count ? `${w.title}: ${count}` : w.title;
      return w.limit ? `${head} (${w.limit})` : head;
    };
    const parts = [info.mainEssay, ...info.requiredWriting].map(describe);
    rows.push({ label: "Essays", text: parts.join("; ") + ".", source: { label: "School admissions page", url: info.essayPageUrl } });
  } else if (facts?.personalEssayRequired) {
    rows.push({ label: "Essays", text: "The Common App personal essay is required.", source: grid });
  }

  // Recommendations, portfolio, fee
  if (facts) {
    const recs: string[] = [];
    if (facts.teacherEvaluations) recs.push(plural(facts.teacherEvaluations, "teacher recommendation"));
    if (facts.otherEvaluations) recs.push(plural(facts.otherEvaluations, "other recommendation"));
    if (facts.counselorRecommendation) recs.push("a counselor recommendation");
    if (facts.midYearReport) recs.push("a mid-year report");
    if (recs.length > 0) rows.push({ label: "Recommendations", text: recs.join(", ") + ".", source: grid });

    if (facts.portfolio) rows.push({ label: "Portfolio", text: `Portfolios go through ${facts.portfolio === "SlideRoom" ? "SlideRoom" : "the school's own system"}.`, source: grid });

    const fee = facts.feeUS ?? facts.feeIntl;
    if (fee) {
      const waiver =
        facts.feeWaiver === "Accepted" ? " The Common App fee waiver is accepted." : facts.feeWaiver === "U.S. only" ? " The Common App fee waiver is accepted for U.S. students only." : facts.feeWaiver === "Not Accepted" ? " The Common App fee waiver is not accepted." : "";
      rows.push({ label: "Application fee", text: `${fee}.${waiver}`, source: grid });
    }
  }

  // Plans and deadlines, only when the plan list is backed by a source
  if (college.applicationPlansProvenance && college.applicationPlans.length > 0) {
    const text = college.applicationPlans
      .filter((p) => p.deadline)
      .map((p) => `${PLAN_LABELS[p.type]}${p.binding === true ? " (binding)" : ""} ${p.deadline}`)
      .join(", ");
    // The plan list names its own source: the Common App grid for most schools, the school's page for those reviewed by hand.
    const cited = /^(.*) \((https?:\/\/[^)]+)\)$/.exec(college.applicationPlansProvenance.source ?? "");
    const source = cited ? { label: cited[1], url: cited[2] } : grid;
    if (text) rows.push({ label: "Deadlines", text: text + ".", source });
  }

  return rows;
}

