import type Anthropic from "@anthropic-ai/sdk";
import { colleges, getCollegeById, displayedAdmitRate, formatPercent } from "./colleges";
import { INTEREST_TAXONOMY, matchesInterest } from "./interests";
import { scholarships, daysLeft, isConfirmed, type Scholarship, type ScholarshipGrade } from "./scholarships";
import { areaMatch, lookupZip } from "./zipCounties";

/**
 * Scout's tools: read-only lookups over the site's own data files. Scout gets
 * no web access and no other source, so anything it says about a college or a
 * scholarship is something the site already shows. Results are kept short:
 * they are read aloud, and every token is paid for.
 */

/** Something Scout looked up, offered to the student as a link under the reply. */
export interface ScoutCard {
  kind: "college" | "scholarship";
  id: string;
  name: string;
  href: string;
}

const INTEREST_IDS = INTEREST_TAXONOMY.map((interest) => interest.id);

export const SCOUT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_colleges",
    description:
      "Find colleges in CollegeScout's directory of 336 US colleges. Use whenever the student asks which colleges fit something (a field of study, a state, size, setting, selectivity) or names a college you need to look up. Returns at most 8 short summaries; call get_college for details on one.",
    input_schema: {
      type: "object",
      properties: {
        name_or_place: {
          type: "string",
          description: "Words to match against the college's name or city, e.g. 'Davis' or 'Boston'.",
        },
        interest: { type: "string", enum: INTEREST_IDS, description: "A field of study from the site's list." },
        state: { type: "string", description: "Two-letter US state code, e.g. 'CA'." },
        system: { type: "string", enum: ["UC", "CSU", "Private", "Public"] },
        setting: { type: "string", enum: ["Urban", "Suburban", "Small City", "Rural"] },
        size: {
          type: "string",
          enum: ["small", "medium", "large"],
          description: "Undergraduates: small under 5,000; medium 5,000 to 15,000; large over 15,000.",
        },
        max_admit_rate: {
          type: "number",
          description: "Only colleges admitting at most this share of applicants, as a fraction (0.3 = 30%).",
        },
        min_admit_rate: {
          type: "number",
          description: "Only colleges admitting at least this share of applicants, as a fraction.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_college",
    description:
      "Details for one college by its id (from search_colleges): admit rate, testing policy, cost of attendance, size, setting and application deadlines.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "search_scholarships",
    description:
      "Find scholarships, contests and awards a student can apply for while in high school, from CollegeScout's checked list. Use for any question about scholarships, money for college, contests or awards. Returns at most 8 short summaries; call get_scholarship for details on one.",
    input_schema: {
      type: "object",
      properties: {
        grade: { type: "integer", enum: [9, 10, 11, 12], description: "The student's grade." },
        zip: {
          type: "string",
          description: "Five-digit ZIP code, only if the student gave it. Hides regional programs that don't cover it.",
        },
        words: {
          type: "string",
          description: "Words to match, e.g. 'essay', 'science', 'Coca-Cola', 'speech'.",
        },
        local_only: {
          type: "boolean",
          description: "Only programs run by a local club or limited to an area.",
        },
        include_closed: {
          type: "boolean",
          description: "Include programs whose deadline has passed this year. Default false.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_scholarship",
    description:
      "Details for one scholarship by its id (from search_scholarships): who can apply, what to submit, how to apply, deadline and award.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
];

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function sizeOf(enrollment: number | null): "small" | "medium" | "large" | null {
  if (enrollment === null) return null;
  return enrollment < 5000 ? "small" : enrollment <= 15000 ? "medium" : "large";
}

function money(value: number | null) {
  return value === null ? "not confirmed" : `$${value.toLocaleString("en-US")}`;
}

function searchColleges(input: Record<string, unknown>, cards: ScoutCard[]) {
  const text = str(input.name_or_place).toLowerCase();
  const interest = str(input.interest);
  const state = str(input.state).toUpperCase();
  const system = str(input.system);
  const setting = str(input.setting);
  const size = str(input.size);
  const maxRate = num(input.max_admit_rate);
  const minRate = num(input.min_admit_rate);

  const matches = colleges.filter((college) => {
    const rate = displayedAdmitRate(college).value;
    if (text && !`${college.name} ${college.location}`.toLowerCase().includes(text)) return false;
    if (interest && INTEREST_IDS.includes(interest) && !matchesInterest(college, interest)) return false;
    if (state && college.state !== state) return false;
    if (system && college.system !== system) return false;
    if (setting && college.campusFit.setting !== setting) return false;
    if (size && sizeOf(college.campusFit.undergradEnrollment) !== size) return false;
    if (maxRate !== null && rate > maxRate) return false;
    if (minRate !== null && rate < minRate) return false;
    return true;
  });

  const shown = matches.slice(0, 8);
  for (const college of shown) {
    cards.push({ kind: "college", id: college.id, name: college.name, href: `/directory/${college.id}` });
  }
  return {
    total_matches: matches.length,
    colleges: shown.map((college) => ({
      id: college.id,
      name: college.name,
      location: college.location,
      admit_rate: formatPercent(displayedAdmitRate(college).value),
      undergraduates: college.campusFit.undergradEnrollment,
    })),
    note:
      matches.length > shown.length
        ? `Only the first ${shown.length} of ${matches.length} are listed. Suggest narrowing, or point the student to Explore Colleges.`
        : undefined,
  };
}

function getCollege(input: Record<string, unknown>, cards: ScoutCard[]) {
  const college = getCollegeById(str(input.id));
  if (!college) return { error: "No college with that id. Use search_colleges first." };
  cards.push({ kind: "college", id: college.id, name: college.name, href: `/directory/${college.id}` });
  const rate = displayedAdmitRate(college);
  return {
    name: college.name,
    location: college.location,
    system: college.system,
    admit_rate: formatPercent(rate.value),
    admit_rate_source: rate.provenance ? `${rate.provenance.source ?? "College Scorecard"} ${rate.provenance.year ?? ""}`.trim() : "school-reported",
    testing_policy: college.testingPolicy,
    undergraduates: college.campusFit.undergradEnrollment,
    setting: college.campusFit.setting,
    cost_of_attendance_in_state: money(college.financials.coaInState),
    cost_of_attendance_out_of_state: money(college.financials.coaOutOfState),
    application_plans: college.applicationPlans.map((plan) => ({
      type: plan.type,
      binding: plan.binding,
      deadline: plan.deadline ?? "not confirmed",
    })),
    profile_page: `/directory/${college.id}`,
  };
}

function scholarshipCard(program: Scholarship): ScoutCard {
  return {
    kind: "scholarship",
    id: program.id,
    name: program.name,
    href: `/scholarships?q=${encodeURIComponent(program.name)}`,
  };
}

function searchScholarships(input: Record<string, unknown>, cards: ScoutCard[]) {
  const grade = num(input.grade);
  const words = str(input.words).toLowerCase().split(/\s+/).filter(Boolean);
  const place = lookupZip(str(input.zip));
  const today = new Date();

  const matches = scholarships.filter((program) => {
    if (grade !== null && !program.grades.includes(grade as ScholarshipGrade)) return false;
    if (input.local_only === true && !program.local) return false;
    if (areaMatch(program, place) === "no") return false;
    const left = daysLeft(program, today);
    if (input.include_closed !== true && left !== null && left < 0) return false;
    const text = [program.name, program.runBy, program.task, program.tagline].join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  });

  const shown = matches.slice(0, 8);
  for (const program of shown) cards.push(scholarshipCard(program));
  return {
    total_matches: matches.length,
    zip: place.status === "found" ? `${place.counties[0]} County` : undefined,
    scholarships: shown.map((program) => ({
      id: program.id,
      name: program.name,
      run_by: program.runBy,
      prize: program.prize ?? program.award,
      what_you_do: program.task,
      deadline: program.deadlineShort ?? (isConfirmed(program.deadline) ? program.deadline : "not confirmed"),
      days_left: daysLeft(program, today),
      only_for: program.only,
      summary: program.tagline,
    })),
    note:
      matches.length > shown.length
        ? `Only the first ${shown.length} of ${matches.length} are listed. Suggest the Scholarships page for the full list.`
        : undefined,
  };
}

function getScholarship(input: Record<string, unknown>, cards: ScoutCard[]) {
  const program = scholarships.find((candidate) => candidate.id === str(input.id));
  if (!program) return { error: "No scholarship with that id. Use search_scholarships first." };
  cards.push(scholarshipCard(program));
  const confirmed = (items: string[]) => items.filter((item) => isConfirmed(item) && !item.includes("Not confirmed"));
  return {
    name: program.name,
    run_by: program.runBy,
    grades: program.grades,
    award: program.award,
    who_can_apply: confirmed(program.eligibility),
    what_you_submit: confirmed(program.whatYouSubmit),
    how_to_apply: confirmed(program.howToApply),
    get_ready: confirmed(program.prepare),
    opens: isConfirmed(program.opens) ? program.opens : "not confirmed",
    deadline: isConfirmed(program.deadline) ? program.deadline : "not confirmed",
    cost_to_enter: program.fee,
    could_not_confirm: program.notes || undefined,
    official_page: program.homepage,
  };
}

/** Runs one tool call. Inputs are model output, so every field is checked before use. */
export function runScoutTool(name: string, input: unknown, cards: ScoutCard[]): string {
  const args = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  let result: unknown;
  switch (name) {
    case "search_colleges":
      result = searchColleges(args, cards);
      break;
    case "get_college":
      result = getCollege(args, cards);
      break;
    case "search_scholarships":
      result = searchScholarships(args, cards);
      break;
    case "get_scholarship":
      result = getScholarship(args, cards);
      break;
    default:
      result = { error: `Unknown tool ${name}` };
  }
  return JSON.stringify(result);
}
