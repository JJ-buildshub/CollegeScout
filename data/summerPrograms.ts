/**
 * Summer Opportunities listings. Adding a program is an edit to this file only.
 *
 * Every date, deadline and amount here was read on the program's own website on `lastVerified`, and
 * officialUrl is the page that states the deadline wherever one is posted. A value the official site
 * doesn't state for summer 2027 is null and shows as "Check official site": a past year's date is
 * never carried forward. The one exception is an amount, which keeps the year it was posted for.
 */
export type SummerCategory = "work" | "university" | "build";
export type SummerCost = "Free" | "Stipend" | "Paid";
export type SummerGrade = 9 | 10 | 11 | 12;

/** The site's interest ids from lib/interests.ts, plus tags the taxonomy has no match for. */
export type SummerInterest =
  | "engineering"
  | "cs-ai"
  | "data-science"
  | "business"
  | "entrepreneurship"
  | "medicine-health"
  | "biology"
  | "nursing"
  | "social-sciences"
  | "visual-arts"
  | "design-architecture"
  | "law-policy"
  | "research"
  | "math"
  | "many-subjects";

/** "bay-area" is one of the nine Bay Area counties; "in-person" is anywhere else. */
export type SummerFormat = { kind: "in-person"; place: string } | { kind: "bay-area"; place: string } | { kind: "online" };

export interface SummerSubmitItem {
  label: string;
  /** ISO date, when the official page gives this piece its own deadline. */
  due?: string;
}

export interface SummerProgram {
  id: string;
  name: string;
  host: string;
  category: SummerCategory;
  interests: SummerInterest[];
  /** null when the official page doesn't say whether it pays or charges. */
  cost: SummerCost | null;
  /** The stipend or price, with the summer it was posted for. */
  amount: { text: string; year: number } | null;
  /** Fees and aid that change what the cost tag means, e.g. an application fee on a free program. */
  costNote: string | null;
  selectivity: string;
  eligibility: {
    /** The grade a student is in now, during the school year before the summer. null when not stated in grades. */
    grades: SummerGrade[] | null;
    /** The official wording in plain terms, e.g. "Current juniors". */
    gradesLabel: string | null;
    minAge: string | null;
    citizenship: string | null;
    location: string | null;
  };
  format: SummerFormat[];
  /** Summer 2027 only. */
  dates: string | null;
  /** ISO date the earliest 2027 session starts, for sorting; null if `dates` gives no start. */
  startDate: string | null;
  /** ISO date of the summer 2027 deadline, or null if not posted. */
  deadline: string | null;
  /** Other rounds, or what the official page says when it gives no exact date. */
  deadlineNote: string | null;
  /** What the official page says to send, and the cycle that list is for. null when no page we could read gives one. */
  toSubmit: { year: number; items: SummerSubmitItem[] } | null;
  officialUrl: string;
  lastVerified: string;
}

const VERIFIED = "2026-10-31";

export const summerPrograms: SummerProgram[] = [
  // --- Work Experience
  {
    id: "nih-sip",
    name: "NIH Summer Internship Program",
    host: "National Institutes of Health",
    category: "work",
    interests: ["medicine-health", "biology", "research"],
    cost: "Stipend",
    amount: null,
    costNote: "Stipends are set each year by education level",
    selectivity: "Selective",
    eligibility: {
      grades: [12],
      gradesLabel: "Seniors who graduate before the internship starts",
      minAge: "18 by Sept 30, 2027 (17 by June 1 if you live within 40 miles of an NIH campus)",
      citizenship: "U.S. citizen or permanent resident",
      location: null,
    },
    format: [{ kind: "in-person", place: "NIH campuses" }],
    dates: "Between May 10 and Aug 31, 2027, set with your lab",
    startDate: "2027-05-10",
    deadline: "2027-01-26",
    deadlineNote: "Reference letters due Feb 2, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with your coursework and grades" },
        { label: "CV or resume" },
        { label: "Personal statement" },
        { label: "Two references, who then send letters", due: "2027-02-02" },
      ],
    },
    officialUrl: "https://www.training.nih.gov/research-training/pb/sip/",
    lastVerified: VERIFIED,
  },
  {
    id: "stanford-simr",
    name: "Stanford Institutes of Medicine Summer Research Program (SIMR)",
    host: "Stanford Medicine",
    category: "work",
    interests: ["medicine-health", "biology", "engineering", "research"],
    cost: "Free",
    amount: null,
    costNote: "$50 application fee, waived for family income under $80,000. Limited need-based stipends. Housing not provided",
    selectivity: "Selective (about 50 students)",
    eligibility: {
      grades: [11, 12],
      gradesLabel: "Current juniors or seniors (class of 2027 or 2028)",
      minAge: "16 by the June 2027 start",
      citizenship: "U.S. citizen or permanent resident",
      location: "Must live and attend high school in the U.S. Selection heavily favors Bay Area students",
    },
    format: [{ kind: "bay-area", place: "Stanford, CA" }],
    dates: "June 7 to July 29, 2027 (tentative)",
    startDate: "2027-06-07",
    deadline: null,
    deadlineNote: "Due in late February 2027; exact date not posted",
    toSubmit: null,
    officialUrl: "https://simr.stanford.edu/",
    lastVerified: VERIFIED,
  },
  {
    id: "nasa-ostem",
    name: "NASA OSTEM Internships",
    host: "NASA",
    category: "work",
    interests: ["engineering", "cs-ai", "research"],
    cost: "Stipend",
    amount: null,
    costNote: "Most interns receive a stipend, based on academic level and session length",
    selectivity: "Selective",
    eligibility: {
      grades: [12],
      gradesLabel: "Seniors, for the summer after graduation",
      minAge: "18 by the session start date",
      citizenship: "U.S. citizen",
      location: null,
    },
    format: [{ kind: "in-person", place: "NASA centers" }],
    dates: null,
    startDate: null,
    deadline: "2027-03-01",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application (letters of recommendation aren't part of it)" },
      ],
    },
    officialUrl: "https://www.nasa.gov/learning-resources/internship-programs/",
    lastVerified: VERIFIED,
  },
  {
    id: "navy-seap",
    name: "Science and Engineering Apprenticeship Program (SEAP)",
    host: "U.S. Office of Naval Research",
    category: "work",
    interests: ["engineering", "cs-ai", "research"],
    cost: "Stipend",
    amount: { text: "$4,000 ($4,500 returning)", year: 2027 },
    costNote: "You arrange your own transportation to the lab",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11, 12],
      gradesLabel: "Sophomores, juniors and seniors, including graduating seniors",
      minAge: "16 by the internship start (some labs make exceptions)",
      citizenship: "U.S. citizen (some labs make exceptions)",
      location: null,
    },
    format: [{ kind: "in-person", place: "Navy labs across the U.S." }],
    dates: null,
    startDate: null,
    deadline: "2026-11-30",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application" },
        { label: "Personal statement" },
        { label: "Recommendations" },
      ],
    },
    officialUrl: "https://www.onr.navy.mil/Education-Outreach/K-12-Programs/SEAP",
    lastVerified: VERIFIED,
  },
  {
    id: "fred-hutch-ship",
    name: "Summer High School Internship Program (SHIP)",
    host: "Fred Hutch Cancer Center",
    category: "work",
    interests: ["medicine-health", "biology", "research"],
    cost: "Stipend",
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [11],
      gradesLabel: "Current juniors (entering senior year)",
      minAge: "16 by the program start",
      citizenship: "International students not accepted",
      location: "Greater Seattle area; no housing provided",
    },
    format: [{ kind: "in-person", place: "Seattle, WA" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: "2027 details to be posted in November",
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online form with short essays" },
        { label: "School transcript (PDF)" },
        { label: "Resume (PDF)" },
        { label: "Two recommendations" },
        { label: "Zoom interview, if invited" },
      ],
    },
    officialUrl: "https://www.fredhutch.org/en/education-training/high-school-students/summer-high-school-internship-program.html",
    lastVerified: VERIFIED,
  },
  {
    id: "ucsf-hip",
    name: "High School Intern Program",
    host: "UCSF Science & Health Education Partnership",
    category: "work",
    interests: ["medicine-health", "biology", "research"],
    cost: "Stipend",
    amount: { text: "$4,500", year: 2027 },
    costNote: null,
    selectivity: "Selective (cohort of 25)",
    eligibility: {
      grades: [11],
      gradesLabel: "Current juniors",
      minAge: null,
      citizenship: null,
      location: "Must attend an SFUSD or San Francisco public charter school",
    },
    format: [{ kind: "bay-area", place: "San Francisco, CA" }],
    dates: "June 7 to July 30, 2027",
    startDate: "2027-06-07",
    deadline: "2027-02-15",
    deadlineNote: "Applications open Jan 15, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application form" },
        { label: "Interview in March, if invited" },
      ],
    },
    officialUrl: "https://sep.ucsf.edu/programs/high-school-students/intern-program/",
    lastVerified: VERIFIED,
  },
  {
    id: "ucsf-cure",
    name: "CURE Research Internship",
    host: "UCSF Center for Science Education and Outreach",
    category: "work",
    interests: ["medicine-health", "biology", "research"],
    cost: null,
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [11],
      gradesLabel: "Current 11th graders (or CCSF students)",
      minAge: "16 by the program start",
      citizenship: null,
      location: "Must live in Alameda, Contra Costa, San Francisco or San Mateo County, or Vallejo",
    },
    format: [{ kind: "bay-area", place: "San Francisco, CA" }],
    dates: "June 14 to Aug 6, 2027",
    startDate: "2027-06-14",
    deadline: "2027-02-07",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application" },
        { label: "Recommendation from a science teacher", due: "2027-02-07" },
      ],
    },
    officialUrl: "https://cseo.ucsf.edu/cure-internship",
    lastVerified: VERIFIED,
  },
  {
    id: "kp-launch",
    name: "KP LAUNCH High School Program",
    host: "Kaiser Permanente",
    category: "work",
    interests: ["medicine-health", "nursing"],
    cost: "Stipend",
    amount: { text: "$25 an hour", year: 2027 },
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [9, 10, 11, 12],
      gradesLabel: "Current high school students and class of 2027; priority to juniors and seniors",
      minAge: "16 to 19 by June 1, 2027",
      citizenship: "Must be legally able to work in the U.S.",
      location: "Must live in a Northern California Kaiser Permanente service area",
    },
    format: [{ kind: "bay-area", place: "Kaiser sites in Northern California" }],
    dates: "June 14 to July 30, 2027",
    startDate: "2027-06-14",
    deadline: "2027-01-08",
    deadlineNote: "Applications open Nov 16, 2026",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application" },
        { label: "Personal statement (750 words or less)" },
        { label: "Resume" },
        { label: "Work permit by June 1, 2027, if selected and under 18" },
      ],
    },
    officialUrl: "https://kplaunch.kaiserpermanente.org/high-school-program/",
    lastVerified: VERIFIED,
  },
  {
    id: "lbnl-einr",
    name: "Experiences in Research",
    host: "Lawrence Berkeley National Laboratory",
    category: "work",
    interests: ["engineering", "cs-ai", "data-science", "research"],
    cost: "Stipend",
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11, 12],
      gradesLabel: "Current 10th, 11th and 12th graders",
      minAge: null,
      citizenship: null,
      location: "Northern California students; priority within 30 miles of the lab",
    },
    format: [{ kind: "bay-area", place: "Berkeley, CA" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application with short answers" },
        { label: "Recommendation from an educator, supervisor or mentor" },
        { label: "Interview, if invited" },
      ],
    },
    officialUrl: "https://k12education.lbl.gov/programs/high-school/experiences-in-research",
    lastVerified: VERIFIED,
  },
  {
    id: "llnl-biotech",
    name: "Biotech Summer Experience",
    host: "Lawrence Livermore National Laboratory",
    category: "work",
    interests: ["biology", "research"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Current 10th and 11th graders",
      minAge: "16 by the start",
      citizenship: "U.S. citizen if 18 at the start",
      location: "Must attend a Northern California high school",
    },
    format: [{ kind: "bay-area", place: "Livermore, CA" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application" },
        { label: "High school transcript (unofficial is fine)" },
        { label: "Letter of recommendation" },
      ],
    },
    officialUrl: "https://st.llnl.gov/sci-ed/summer-workshops/biotech-summer-experience",
    lastVerified: VERIFIED,
  },

  // --- University Programs
  {
    id: "stanford-summer-institutes",
    name: "Stanford Pre-Collegiate Summer Institutes",
    host: "Stanford Pre-Collegiate Studies",
    category: "university",
    interests: ["many-subjects", "cs-ai", "engineering", "math"],
    cost: "Paid",
    amount: { text: "$3,200", year: 2026 },
    costNote: "Financial aid available",
    selectivity: "Selective",
    eligibility: {
      grades: [9, 10, 11],
      gradesLabel: "Current grades 8 to 11",
      minAge: null,
      citizenship: null,
      location: null,
    },
    format: [{ kind: "online" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application form" },
        { label: "Unofficial transcripts" },
        { label: "$65 application fee (waivers available)" },
      ],
    },
    officialUrl: "https://summerinstitutes.spcs.stanford.edu/",
    lastVerified: VERIFIED,
  },
  {
    id: "stanford-sumac",
    name: "Stanford University Mathematics Camp (SUMaC)",
    host: "Stanford Pre-Collegiate Studies",
    category: "university",
    interests: ["math"],
    cost: "Paid",
    amount: { text: "$8,950 residential, $3,750 online", year: 2026 },
    costNote: "Financial aid available",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Current 10th and 11th graders",
      minAge: "15 during the program",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "bay-area", place: "Stanford, CA" }, { kind: "online" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application form" },
        { label: "Unofficial transcripts" },
        { label: "Recommendation from a math teacher" },
        { label: "$65 application fee (waivers available)" },
        { label: "Video essay (optional)" },
      ],
    },
    officialUrl: "https://sumac.spcs.stanford.edu/",
    lastVerified: VERIFIED,
  },
  {
    id: "berkeley-pre-college",
    name: "Berkeley Pre-College Scholars",
    host: "UC Berkeley Summer Sessions",
    category: "university",
    interests: ["many-subjects"],
    cost: "Paid",
    amount: { text: "$635 per unit, plus fees", year: 2026 },
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Have finished 10th or 11th grade by the start of classes",
      minAge: null,
      citizenship: null,
      location: "Commuter track is for Bay Area students; residential and virtual tracks are also offered",
    },
    format: [{ kind: "bay-area", place: "Berkeley, CA" }, { kind: "online" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application with two short answers (100 words each)" },
        { label: "High school transcript (PDF)" },
      ],
    },
    officialUrl: "https://precollege.berkeley.edu/",
    lastVerified: VERIFIED,
  },
  {
    id: "cosmos",
    name: "California State Summer School for Mathematics & Science (COSMOS)",
    host: "University of California",
    category: "university",
    interests: ["engineering", "cs-ai", "biology", "math"],
    cost: "Paid",
    amount: { text: "$5,793", year: 2027 },
    costNote: "$46 to $48 application fee (the page lists both). Financial aid and fee waivers available",
    selectivity: "Selective",
    eligibility: {
      grades: [9, 10, 11, 12],
      gradesLabel: "Completing grades 8 to 12 by the summer (a campus page says through grade 11, so confirm)",
      minAge: null,
      citizenship: null,
      location: "California high school students only",
    },
    format: [{ kind: "in-person", place: "UC Davis, Irvine, Los Angeles, Merced, San Diego or Santa Cruz" }],
    dates: null,
    startDate: null,
    deadline: "2027-02-05",
    deadlineNote: "Applications open Jan 6, 2027",
    toSubmit: {
      year: 2026,
      items: [
        { label: "Online application with one personal statement" },
        { label: "Unofficial transcripts" },
        { label: "At least one teacher recommendation" },
        { label: "Parent or guardian signature" },
      ],
    },
    officialUrl: "https://cosmos-ucop.ucdavis.edu/app/main/page/dates-deadlines",
    lastVerified: VERIFIED,
  },
  {
    id: "ucsc-sip",
    name: "Scholar Immersion Program (SIP)",
    host: "UC Santa Cruz",
    category: "university",
    interests: ["research", "engineering", "biology", "social-sciences"],
    cost: "Paid",
    amount: null,
    costNote: "$68 application fee, waivers on request. 2027 program costs to be posted by December 2026",
    selectivity: "Selective",
    eligibility: {
      grades: [9, 10, 11],
      gradesLabel: "High school students who won't have graduated by summer",
      minAge: "14 to 17 during the program (some projects require 16)",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Santa Cruz, CA" }],
    dates: "June 14 to Aug 7, 2027 (tentative)",
    startDate: "2027-06-14",
    deadline: "2027-02-26",
    deadlineNote: "Tentative. Applications open Jan 15, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with essays" },
        { label: "Unofficial transcript" },
        { label: "Reference from a teacher or mentor", due: "2027-03-05" },
        { label: "$68 application fee (waivers on request)" },
      ],
    },
    officialUrl: "https://sip.ucsc.edu/applying-to-sip/",
    lastVerified: VERIFIED,
  },
  {
    id: "rsi",
    name: "Research Science Institute (RSI)",
    host: "Center for Excellence in Education",
    category: "university",
    interests: ["research", "engineering"],
    cost: "Free",
    amount: null,
    costNote: "$75 application fee, waivers may be available",
    selectivity: "Selective (100 at MIT, 50 at Stanford)",
    eligibility: {
      grades: [11],
      gradesLabel: "Current juniors",
      minAge: "16 by July 1, 2027",
      citizenship: "U.S. citizen or permanent resident, or from a participating country",
      location: null,
    },
    format: [
      { kind: "in-person", place: "MIT, Cambridge, MA" },
      { kind: "bay-area", place: "Stanford, CA" },
    ],
    dates: null,
    startDate: null,
    deadline: "2026-12-11",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with essays" },
        { label: "Recommendations from two teachers" },
        { label: "Official high school transcript" },
        { label: "All PSAT, SAT, ACT and AP scores" },
      ],
    },
    officialUrl: "https://www.cee.org/programs/research-science-institute",
    lastVerified: VERIFIED,
  },
  {
    id: "cmu-sams",
    name: "Summer Academy for Math and Science (SAMS)",
    host: "Carnegie Mellon University",
    category: "university",
    interests: ["engineering", "cs-ai", "math"],
    cost: "Free",
    amount: null,
    costNote: "You pay only for travel",
    selectivity: "Selective",
    eligibility: {
      grades: [11],
      gradesLabel: "Current 11th graders",
      minAge: "16 by June 26, 2027",
      citizenship: "U.S. citizen or permanent resident",
      location: null,
    },
    format: [{ kind: "in-person", place: "Pittsburgh, PA" }],
    dates: "Online start June 21 to 22, on campus until Aug 7, 2027",
    startDate: "2027-06-21",
    deadline: "2027-02-01",
    deadlineNote: "Decisions Apr 1, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with two essays" },
        { label: "Unofficial transcript" },
        { label: "Standardized test scores" },
        { label: "Two letters of recommendation (one from a current math teacher)" },
      ],
    },
    officialUrl: "https://www.cmu.edu/pre-college/academic-programs/sams.html",
    lastVerified: VERIFIED,
  },
  {
    id: "cmu-ai-scholars",
    name: "AI Scholars",
    host: "Carnegie Mellon University",
    category: "university",
    interests: ["cs-ai"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [11],
      gradesLabel: "Current 11th graders",
      minAge: "16 by June 26, 2027",
      citizenship: "U.S. citizen or permanent resident",
      location: null,
    },
    format: [{ kind: "in-person", place: "Pittsburgh, PA" }],
    dates: "June 26 to July 24, 2027",
    startDate: "2027-06-26",
    deadline: "2027-02-01",
    deadlineNote: "Decisions Apr 1, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with essays" },
        { label: "Unofficial transcript" },
        { label: "Two letters of recommendation" },
      ],
    },
    officialUrl: "https://www.cmu.edu/pre-college/academic-programs/ai_scholars.html",
    lastVerified: VERIFIED,
  },
  {
    id: "cmu-cs-scholars",
    name: "CS Scholars",
    host: "Carnegie Mellon University",
    category: "university",
    interests: ["cs-ai"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Selective",
    eligibility: {
      grades: [10],
      gradesLabel: "Current 10th graders",
      minAge: "16 by June 26, 2027",
      citizenship: "U.S. citizen or permanent resident",
      location: null,
    },
    format: [{ kind: "in-person", place: "Pittsburgh, PA" }],
    dates: "June 26 to July 24, 2027",
    startDate: "2027-06-26",
    deadline: "2027-02-01",
    deadlineNote: "Decisions Apr 1, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with essays" },
        { label: "Unofficial transcript" },
        { label: "Two letters of recommendation" },
      ],
    },
    officialUrl: "https://www.cmu.edu/pre-college/academic-programs/computer-science-scholars.html",
    lastVerified: VERIFIED,
  },
  {
    id: "yale-yygs",
    name: "Yale Young Global Scholars",
    host: "Yale University",
    category: "university",
    interests: ["engineering", "law-policy", "social-sciences"],
    cost: "Paid",
    amount: { text: "$7,500", year: 2027 },
    costNote: "$100 application fee, waivers available. Need-based aid up to full tuition. Travel not covered",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Current sophomores and juniors",
      minAge: "16 to 18 by July 18, 2027",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "New Haven, CT" }],
    dates: "June 20 to July 2, July 4 to 16, or a third session from July 18, 2027",
    startDate: "2027-06-20",
    deadline: "2027-01-06",
    deadlineNote: "Regular Decision. Early Action closed Oct 15, 2026",
    toSubmit: null,
    officialUrl: "https://globalscholars.yale.edu/application-deadlines",
    lastVerified: VERIFIED,
  },
  {
    id: "harvard-pre-college",
    name: "Pre-College Program",
    host: "Harvard Summer School",
    category: "university",
    interests: ["many-subjects"],
    cost: "Paid",
    amount: { text: "$6,250", year: 2027 },
    costNote: "$75 application fee. Limited need-based scholarships",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Rising juniors and seniors (graduating in 2028 or 2029)",
      minAge: "16 by June 13, 2027, and under 19 through July 31, 2027",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Cambridge, MA" }],
    dates: "June 21 to July 2, July 12 to 23, or July 26 to Aug 6, 2027",
    startDate: "2027-06-21",
    deadline: "2027-02-10",
    deadlineNote: "Regular deadline. Early Jan 13, late Mar 31, 2027",
    toSubmit: null,
    officialUrl: "https://summer.harvard.edu/high-school-programs/pre-college-program/",
    lastVerified: VERIFIED,
  },
  {
    id: "mites-summer",
    name: "MITES Summer",
    host: "MIT",
    category: "university",
    interests: ["engineering", "cs-ai", "math"],
    cost: "Free",
    amount: null,
    costNote: "You pay only for travel",
    selectivity: "Selective",
    eligibility: {
      grades: [11],
      gradesLabel: "Current juniors",
      minAge: null,
      citizenship: "U.S. citizen or permanent resident",
      location: null,
    },
    format: [{ kind: "in-person", place: "Cambridge, MA" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: "Applications run during the fall of junior year; exact date not posted on this page",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with short answers" },
        { label: "Teacher recommendations" },
      ],
    },
    officialUrl: "https://mites.mit.edu/discover-mites/mites-summer/",
    lastVerified: VERIFIED,
  },
  {
    id: "risd-pre-college",
    name: "RISD Pre-College",
    host: "Rhode Island School of Design",
    category: "university",
    interests: ["visual-arts", "design-architecture"],
    cost: "Paid",
    amount: { text: "$12,495 residential, $9,595 commuter", year: 2026 },
    costNote: "$60 application fee. Scholarships available. 2027 costs to be announced in November",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Between 10th and 11th, or 11th and 12th grade, in summer 2027",
      minAge: "16 to 18",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Providence, RI" }, { kind: "online" }],
    dates: "On campus June 26 to July 31, online June 21 to July 29, 2027",
    startDate: "2027-06-21",
    deadline: null,
    deadlineNote: "Rolling review from Nov 4, 2026. Scholarship deadline Jan 29, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application signed by you and a parent or guardian" },
        { label: "Short written responses (1 to 5 sentences each)" },
        { label: "$60 application fee" },
      ],
    },
    officialUrl: "https://precollege.risd.edu/on-campus/application-information",
    lastVerified: VERIFIED,
  },
  {
    id: "notre-dame-leadership",
    name: "Leadership Seminars",
    host: "University of Notre Dame",
    category: "university",
    interests: ["law-policy", "social-sciences"],
    cost: "Free",
    amount: null,
    costNote: "Tuition, housing and meals are paid. $75 application fee and $150 enrollment fee",
    selectivity: "Highly competitive",
    eligibility: {
      grades: [11],
      gradesLabel: "Current juniors",
      minAge: "16 by Aug 1, 2027",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Notre Dame, IN" }],
    dates: "June 19 to 30, or July 10 to 21, 2027",
    startDate: "2027-06-19",
    deadline: "2027-01-20",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application" },
        { label: "High school transcript and counselor report" },
        { label: "Letter of recommendation from a teacher" },
        { label: "SAT, ACT or PSAT scores (optional)", due: "2027-01-31" },
      ],
    },
    officialUrl: "https://precollege.nd.edu/leadership-seminars/application-and-admission/",
    lastVerified: VERIFIED,
  },
  {
    id: "georgetown-medical-academy",
    name: "Medical Academy",
    host: "Georgetown University",
    category: "university",
    interests: ["medicine-health"],
    cost: "Paid",
    amount: { text: "$4,120 residential, $3,490 commuter", year: 2026 },
    costNote: null,
    selectivity: "Application required",
    eligibility: {
      grades: null,
      gradesLabel: null,
      minAge: "15",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Washington, DC" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: "2027 offerings to be posted Nov 16, 2026",
    toSubmit: null,
    officialUrl: "https://summer.georgetown.edu/programs/SHS19/medical-academy/",
    lastVerified: VERIFIED,
  },

  // --- Build Your Own
  {
    id: "berkeley-bbay",
    name: "Summer Entrepreneurship Residency (B-BAY)",
    host: "UC Berkeley Haas School of Business",
    category: "build",
    interests: ["entrepreneurship", "business"],
    cost: "Paid",
    amount: { text: "$7,750 in state, $8,250 out of state", year: 2027 },
    costNote: "$100 application fee",
    selectivity: "Selective (50 students)",
    eligibility: {
      grades: null,
      gradesLabel: "High school students",
      minAge: null,
      citizenship: null,
      location: null,
    },
    format: [{ kind: "bay-area", place: "Berkeley, CA" }],
    dates: "June 13 to 26, or June 27 to July 10, 2027",
    startDate: "2027-06-13",
    deadline: "2026-11-29",
    deadlineNote: "Applications open Nov 2. Teacher recommendations due Dec 4, 2026",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application and $100 fee" },
        { label: "One essay (500 words or less)" },
        { label: "Two-minute video essay" },
        { label: "Transcript covering the past two years" },
        { label: "Two teacher recommendations", due: "2026-12-04" },
      ],
    },
    officialUrl: "https://haas.berkeley.edu/business-academy/high-school/high-school-entrepreneurship/apply-now-copy/",
    lastVerified: VERIFIED,
  },
  {
    id: "launchx",
    name: "LaunchX Entrepreneurship Program",
    host: "LaunchX",
    category: "build",
    interests: ["entrepreneurship", "business"],
    cost: "Paid",
    amount: { text: "$13,495 in person, from $6,495 online", year: 2027 },
    costNote: "Financial awards available; apply by Mar 4, 2027 to be considered",
    selectivity: "Selective",
    eligibility: {
      grades: [9, 10, 11, 12],
      gradesLabel: "High school students",
      minAge: "14 to 18",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Ann Arbor, MI" }, { kind: "online" }],
    dates: "In person June 27 to July 24, online July 5 to Aug 6, 2027",
    startDate: "2027-06-27",
    deadline: "2027-03-31",
    deadlineNote: "Final deadline; may close early. Priority Nov 11, 2026, early Jan 21, 2027",
    toSubmit: {
      year: 2027,
      items: [
        { label: "Online application with four sections" },
        { label: "Unofficial transcript" },
        { label: "Interview, if invited" },
        { label: "Short video (optional)" },
      ],
    },
    officialUrl: "https://www.launchx.com/admissions/how-to-apply",
    lastVerified: VERIFIED,
  },
  {
    id: "babson-summer-study",
    name: "Babson Academy Summer Study",
    host: "Babson College",
    category: "build",
    interests: ["entrepreneurship", "business"],
    cost: "Paid",
    amount: null,
    costNote: "Financial assistance available; apply by Feb 12, 2027",
    selectivity: "Selective",
    eligibility: {
      grades: [10, 11],
      gradesLabel: "Rising juniors and seniors",
      minAge: "15 by the start",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "in-person", place: "Marlborough, MA" }, { kind: "online" }],
    dates: "July 12 to 30, 2027",
    startDate: "2027-07-12",
    deadline: "2027-02-12",
    deadlineNote: "In-person deadline. Online Mar 12, 2027",
    toSubmit: null,
    officialUrl: "https://www.babson.edu/summer-at-babson/high-school-learners/summer-study/key-dates/",
    lastVerified: VERIFIED,
  },
  {
    id: "diamond-challenge",
    name: "Diamond Challenge",
    host: "Horn Entrepreneurship, University of Delaware",
    category: "build",
    interests: ["entrepreneurship", "business"],
    cost: "Free",
    amount: null,
    costNote: "Runs during the school year, not over the summer",
    selectivity: "Competition",
    eligibility: {
      grades: [9, 10, 11, 12],
      gradesLabel: "High school students, in teams of 2 to 4 with an adult advisor",
      minAge: "14 to 18 at the deadline",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "online" }],
    dates: "Final summit Apr 29 to 30, 2027",
    startDate: null,
    deadline: "2027-01-14",
    deadlineNote: null,
    toSubmit: {
      year: 2027,
      items: [
        { label: "Team of 2 to 4 with an adult advisor" },
        { label: "Written concept narrative (3 to 5 pages)" },
        { label: "Introductory video (60 seconds)" },
      ],
    },
    officialUrl: "https://diamondchallenge.org/competition/",
    lastVerified: VERIFIED,
  },
  {
    id: "kode-with-klossy",
    name: "Kode With Klossy Camp",
    host: "Kode With Klossy",
    category: "build",
    interests: ["cs-ai", "data-science"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Application required",
    eligibility: {
      grades: null,
      gradesLabel: "Ages 13 to 18",
      minAge: "13",
      citizenship: null,
      location: "For young women and gender-expansive people",
    },
    format: [
      { kind: "online" },
      { kind: "bay-area", place: "Oakland or San Francisco, CA" },
      { kind: "in-person", place: "Chicago, Dallas, New York, Seattle, St. Louis or Washington, DC" },
    ],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: "Camp applications open February 2027",
    toSubmit: null,
    officialUrl: "https://www.kodewithklossy.com/programs",
    lastVerified: VERIFIED,
  },
  {
    id: "hack-club",
    name: "Hack Club",
    host: "Hack Club",
    category: "build",
    interests: ["cs-ai", "engineering"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Open to all teens",
    eligibility: {
      grades: null,
      gradesLabel: "Ages 13 to 18",
      minAge: "13",
      citizenship: null,
      location: null,
    },
    format: [{ kind: "online" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: null,
    officialUrl: "https://hackclub.com/",
    lastVerified: VERIFIED,
  },
  {
    id: "congressional-app-challenge",
    name: "Congressional App Challenge",
    host: "U.S. House of Representatives",
    category: "build",
    interests: ["cs-ai"],
    cost: "Free",
    amount: null,
    costNote: null,
    selectivity: "Competition",
    eligibility: {
      grades: [9, 10, 11, 12],
      gradesLabel: "Middle and high school students, alone or in teams of up to 4",
      minAge: null,
      citizenship: "U.S. resident; no citizenship requirement",
      location: "Must live or go to school in a participating district",
    },
    format: [{ kind: "online" }],
    dates: null,
    startDate: null,
    deadline: null,
    deadlineNote: null,
    toSubmit: null,
    officialUrl: "https://www.congressionalappchallenge.us/students/rules/",
    lastVerified: VERIFIED,
  },
];

/**
 * Lines quoted word for word from each program's official pages. scripts/check-summer-programs.mts looks
 * for them every day, and a line that has disappeared means the page changed and the listing needs another
 * look. A program with a blank deadline quotes what its page says instead (a closed 2026 cycle, say), so
 * the same check reports when the 2027 dates go up. Every program in summerPrograms needs an entry here.
 */
export const summerProgramSources: Record<string, { url: string; evidence: string[] }[]> = {
  "nih-sip": [
    {
      url: "https://www.training.nih.gov/research-training/pb/sip/",
      evidence: ["Reference Letters are due Tuesday, February 2, 2027 at 12 pm (noon) ET.", "Personal Statement - a statement broadly describing", "CV/Resume - a list of your education"],
    },
    {
      url: "https://www.training.nih.gov/research-training/pb/sip/",
      evidence: [
        "The application will close on Tuesday, January 26, 2027 at 12 pm (noon) ET.",
        "must be completed between May 10 and August 31, 2027",
        "18 years old by September 30, 2027.",
      ],
    },
  ],
  "stanford-simr": [
    {
      url: "https://simr.stanford.edu/",
      evidence: ["June 7- July 29, 2027 (8 weeks)", "Applications will be due in late February 2027.", "16 years old or older"],
    },
    {
      url: "https://simr.stanford.edu/frequently-asked-questions.html",
      evidence: ["There is a $50 application fee to apply.", "there is NO COST for any student"],
    },
  ],
  "nasa-ostem": [
    {
      url: "https://www.nasa.gov/learning-resources/internship-programs/",
      evidence: ["Letters of recommendation are not part of the NASA Office of STEM Engagement Internships application."],
    },
    {
      url: "https://www.nasa.gov/learning-resources/internship-programs/",
      evidence: ["Summer 2027 Application Deadline: March 1, 2027 (11:59 p.m. ET)", "Must be 18 or older by the published start date of session"],
    },
  ],
  "navy-seap": [
    {
      url: "https://www.navalsteminterns.us/seap/",
      evidence: ["Interns are selected based on academic achievement, personal statements, recommendations"],
    },
    {
      url: "https://www.onr.navy.mil/Education-Outreach/K-12-Programs/SEAP",
      evidence: ["The online application period is now open through November 30th for the Summer 2027 internship program.", "First-Year Interns : $4,000", "Returning Interns : $4,500"],
    },
    {
      url: "https://www.navalsteminterns.us/seap/",
      evidence: ["Must be 16 years old or older by the internship start date"],
    },
  ],
  "fred-hutch-ship": [
    {
      url: "https://www.fredhutch.org/en/education-training/high-school-students/summer-high-school-internship-program.html",
      evidence: ["Upload a PDF of your recent school transcript", "Upload a PDF of your resume", "We require two recommendations"],
    },
    {
      url: "https://www.fredhutch.org/en/education-training/high-school-students/summer-high-school-internship-program.html",
      evidence: ["Information on the 2027 program will be posted in November.", "Be 16 years or older by start of program"],
    },
  ],
  "ucsf-hip": [
    {
      url: "https://sep.ucsf.edu/programs/high-school-students/intern-program/",
      evidence: ["A completed electronic application form.", "March: Student interviews"],
    },
    {
      url: "https://sep.ucsf.edu/programs/high-school-students/intern-program/",
      evidence: ["January 15: Applications open", "February 15: Applications due", "June 7: Program begins", "July 30 : Program ends", "Receive $4500 upon full completion of the program."],
    },
  ],
  "ucsf-cure": [
    {
      url: "https://cseo.ucsf.edu/cure-internship",
      evidence: ["One recommendation form is required from a current or former science teacher.", "Recommendation Form Deadline: Sunday, February 7, 2027"],
    },
    {
      url: "https://cseo.ucsf.edu/cure-internship",
      evidence: ["Application Deadline: Sunday, February 7, 2027 at 11:59pm PST.", "Monday, June 14th 2027- Friday, August 6th 2027", "Must be a current 11th grader"],
    },
  ],
  "kp-launch": [
    {
      url: "https://kplaunch.kaiserpermanente.org/apply-now/",
      evidence: ["A personal statement and resume will be required to complete your application.", "In 750 words or less"],
    },
    {
      url: "https://kplaunch.kaiserpermanente.org/high-school-program/",
      evidence: ["Applications Open at 9am PST on 11/16/26 and close on 1/8/27 at 5pm PST", "June 14th – July 30th", "$25 per hour"],
    },
  ],
  "lbnl-einr": [
    {
      url: "https://k12education.lbl.gov/programs/high-school/experiences-in-research/application",
      evidence: ["accompanied by a recommendation by an educator, supervisor or mentor", "Short Answers"],
    },
    {
      url: "https://k12education.lbl.gov/programs/high-school/experiences-in-research",
      evidence: ["Applications are closed for Summer 2026.", "paid internships"],
    },
  ],
  "llnl-biotech": [
    {
      url: "https://st.llnl.gov/sci-ed/summer-workshops/biotech-summer-experience",
      evidence: ["Most recent high school transcript; unofficial copy will be accepted"],
    },
    {
      url: "https://st.llnl.gov/sci-ed/summer-workshops/biotech-summer-experience",
      evidence: ["STUDENT APPLICATION DEADLINE : February 26, 2026", "There is NO cost to attend; the workshop is FREE."],
    },
  ],
  "stanford-summer-institutes": [
    {
      url: "https://summerinstitutes.spcs.stanford.edu/admissions",
      evidence: ["We require unofficial transcripts", "$65 Application Fee"],
    },
    {
      url: "https://summerinstitutes.spcs.stanford.edu/",
      evidence: ["Our application for the 2026 Stanford Pre-Collegiate Summer Institutes is now closed."],
    },
    {
      url: "https://summerinstitutes.spcs.stanford.edu/tuition-and-financial-aid",
      evidence: ["Tuition for Stanford Pre-Collegiate Summer Institutes is $3,200."],
    },
  ],
  "stanford-sumac": [
    {
      url: "https://sumac.spcs.stanford.edu/sumac-admissions",
      evidence: ["We require one online recommendation form from a math teacher.", "$65 Application Fee"],
    },
    {
      url: "https://sumac.spcs.stanford.edu/",
      evidence: ["Our application for the 2026 Stanford University Mathematics Camp is now closed."],
    },
    {
      url: "https://sumac.spcs.stanford.edu/tuition-and-financial-aid-sumac",
      evidence: ["Online: $3,750", "Residential $8,950"],
    },
  ],
  "berkeley-pre-college": [
    {
      url: "https://precollege.berkeley.edu/commuter",
      evidence: ["two short answers (100 words each)", "Upload a PDF copy of your most recent high school transcript"],
    },
    {
      url: "https://precollege.berkeley.edu/commuter",
      evidence: ["Application deadline: Monday, June 1, 2026 11:59pm (Pacific Time)", "Have completed 10th or 11th grade by the start of summer classes", "$635"],
    },
  ],
  cosmos: [
    {
      url: "https://cosmos.ucsc.edu/how-to-apply/",
      evidence: ["Request at least one teacher recommendation.", "Upload unofficial transcripts.", "through rising eleventh graders"],
    },
    {
      url: "https://cosmos-ucop.ucdavis.edu/app/main/page/dates-deadlines",
      evidence: ["Online Application Closes: February 5, 2027, at 5:00 PM", "PROGRAM COST: $5,793", "Opening Day 2027: TBA"],
    },
  ],
  "ucsc-sip": [
    {
      url: "https://sip.ucsc.edu/applying-to-sip/",
      evidence: ["One reference from a teacher or mentor", "Friday, March 5, 2027"],
    },
    {
      url: "https://sip.ucsc.edu/applying-to-sip/",
      evidence: ["Friday, February 26, 2027 at 12:00 noon PST", "Program costs for 2027 will become available by December, 2026.", "US $68 for SIP 2027"],
    },
  ],
  rsi: [
    {
      url: "https://www.cee.org/programs/apply-rsi",
      evidence: ["Recommendations by two teachers", "official high school transcript", "These include the PSAT, SAT, ACT, and AP exams."],
    },
    {
      url: "https://www.cee.org/programs/research-science-institute",
      evidence: ["Applications for RSI 2027 are open through 11:59pm December 11, 2026.", "In 2027, CEE is expanding the RSI to Stanford for 50 young scholars."],
    },
    {
      url: "https://www.cee.org/programs/research-science-institute-rsi/rsi-application-faqs",
      evidence: ["Applicants must be 16 years of age by July 1 of the program year.", "there is a non-refundable application fee of $75"],
    },
  ],
  "cmu-sams": [
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/sams.html",
      evidence: ["Two (2) letters of recommendation (one must be from a current math instructor*)", "Completion of two essay prompts indicated in the application", "Standardized test scores"],
    },
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/sams.html",
      evidence: ["You must be 16 years of age by June 26, 2027.", "August 7, 2027", "February 1, 2027"],
    },
  ],
  "cmu-ai-scholars": [
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/ai_scholars.html",
      evidence: ["Two (2) letters of recommendation", "Unofficial high school transcript"],
    },
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/ai_scholars.html",
      evidence: ["June 26, 2027: Opening Day/Residential Move-In", "July 24, 2027", "February 1, 2027"],
    },
  ],
  "cmu-cs-scholars": [
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/computer-science-scholars.html",
      evidence: ["Two (2) letters of recommendation", "Unofficial high school transcript"],
    },
    {
      url: "https://www.cmu.edu/pre-college/academic-programs/computer-science-scholars.html",
      evidence: ["June 26, 2027: Opening Day", "July 24, 2027", "February 1, 2027"],
    },
  ],
  "yale-yygs": [
    {
      url: "https://globalscholars.yale.edu/application-deadlines",
      evidence: ["11:59pm ET on January 6, 2027", "$100 USD"],
    },
    {
      url: "https://globalscholars.yale.edu/tuition",
      evidence: ["is $7,500 USD"],
    },
    {
      url: "https://globalscholars.yale.edu/eligibility",
      evidence: ["Be between the ages of 16-18 years old by July 18, 2027"],
    },
  ],
  "harvard-pre-college": [
    {
      url: "https://summer.harvard.edu/high-school-programs/pre-college-program/",
      evidence: ["Regular Application & Financial Aid Deadline: Wednesday, February 10, 2027", "$6,250 + $75 application fee", "June 21–July 2, 2027", "Are at least 16 years old by June 13, 2027"],
    },
  ],
  "mites-summer": [
    {
      url: "https://mites.mit.edu/apply/",
      evidence: ["Use the Short Answer section", "For recommenders, consider recent teachers"],
    },
    {
      url: "https://mites.mit.edu/discover-mites/mites-summer/",
      evidence: ["All program-related costs are covered", "Eligible students can apply online during the fall semester of their junior year"],
    },
  ],
  "risd-pre-college": [
    {
      url: "https://precollege.risd.edu/on-campus/application-information",
      evidence: ["A completed application with electronic signatures from both you and a parent/guardian.", "sentence response to each of the following questions", "A $60 non-refundable application fee."],
    },
    {
      url: "https://precollege.risd.edu/on-campus/application-information",
      evidence: ["Applications for summer 2027 open November 4, 2026.", "JAN 29, 2027"],
    },
    {
      url: "https://precollege.risd.edu/on-campus/tuition-and-fees",
      evidence: ["Residential program: $12,495", "Commuter program: $9,595", "2027 program costs will be announced in November"],
    },
    {
      url: "https://precollege.risd.edu/",
      evidence: ["June 26–July 31, 2027", "June 21–July 29, 2027"],
    },
  ],
  "notre-dame-leadership": [
    {
      url: "https://precollege.nd.edu/leadership-seminars/application-and-admission/",
      evidence: ["Interested students must submit an online application, a high school transcript, a counselor report, and a letter of recommendation from a high school teacher.", "Scores will be accepted up until January 31, 2027."],
    },
    {
      url: "https://precollege.nd.edu/leadership-seminars/application-and-admission/",
      evidence: ["Applications and all supporting documents must be submitted by January 20, 2027", "Session I June 19 - June 30, 2027", "At least 16 years-old by or on August 1, 2027."],
    },
    {
      url: "https://precollege.nd.edu/leadership-seminars/ls-fees-financial-aid/",
      evidence: ["A non-refundable $75 application fee", "A non-refundable enrollment fee of $150"],
    },
  ],
  "georgetown-medical-academy": [
    {
      url: "https://summer.georgetown.edu/programs/SHS19/medical-academy/",
      evidence: ["Check back on November 16 for our offerings", "$4,120", "$3,490"],
    },
  ],
  "berkeley-bbay": [
    {
      url: "https://haas.berkeley.edu/business-academy/high-school/high-school-entrepreneurship/apply-now-copy/",
      evidence: ["All teacher recommendations must be submitted by 8:59 PM PST on Friday, December 4th.", "The essay must be 500 words or less", "The video essay should not exceed two minutes.", "A non-refundable $100 application fee"],
    },
    {
      url: "https://haas.berkeley.edu/business-academy/high-school/high-school-entrepreneurship/apply-now-copy/",
      evidence: ["Applications open: November 02 – November 29, 2026", "HSEN 1: June 13 – June 26, 2027"],
    },
    {
      url: "https://haas.berkeley.edu/business-academy/high-school/high-school-entrepreneurship/dates-fees/",
      evidence: ["In-state: $7,750", "Out-of-state: $8,250"],
    },
  ],
  launchx: [
    {
      url: "https://www.launchx.com/admissions/how-to-apply",
      evidence: ["Complete the four sections and upload your transcript.", "Selected applicants are invited to an interview."],
    },
    {
      url: "https://www.launchx.com/admissions/how-to-apply",
      evidence: ["Summer Final Deadline — March 31, 2027"],
    },
    {
      url: "https://www.launchx.com/program/entrepreneurship",
      evidence: ["The LaunchX Entrepreneurship Program costs $13,495.", "June 27 – July 24"],
    },
    {
      url: "https://www.launchx.com/program/online-entrepreneurship",
      evidence: ["begin at $6,495", "July 5 – August 6"],
    },
  ],
  "babson-summer-study": [
    {
      url: "https://www.babson.edu/summer-at-babson/high-school-learners/summer-study/key-dates/",
      evidence: ["2027 Babson Academy Summer Study - Key Dates & Deadlines", "Round One (Early Bird) Application Deadline", "July 12-30"],
    },
    {
      url: "https://www.babson.edu/summer-study",
      evidence: ["a student must be a rising high school junior or senior, and be at least 15 by the start date of the program"],
    },
  ],
  "diamond-challenge": [
    {
      url: "https://diamondchallenge.org/competition/",
      evidence: ["The narrative is limited to 3-5 pages", "The video is strictly limited to 60 seconds.", "Teams must consist of 2-4 high school students"],
    },
    {
      url: "https://diamondchallenge.org/competition/",
      evidence: ["January 14 | Submission Deadline (5PM EST)", "April 29-30 | Limitless World Summit", "aged 14-18 at the submission deadline"],
    },
  ],
  "kode-with-klossy": [
    {
      url: "https://www.kodewithklossy.com/programs",
      evidence: ["Camp applications open for Summer 2027", "ages 13-18"],
    },
  ],
  "hack-club": [
    {
      url: "https://hackclub.com/",
      evidence: ["For all teens aged 13–18.", "Hack Club is free for every teenager, forever."],
    },
  ],
  "congressional-app-challenge": [
    {
      url: "https://www.congressionalappchallenge.us/students/rules/",
      evidence: ["2026 IMPORTANT DATES", "There is no citizen requirement for students."],
    },
  ],
};

/** The Build Your Own guide: general ideas, not listings, so it carries no dates or sources. */
export const passionProjectIdeas: { id: string; title: string; summary: string; steps: string[] }[] = [
  {
    id: "club",
    title: "Start a club",
    summary: "Bring together students at your school around something you care about.",
    steps: [
      "Ask your school's activities office how a new club gets approved",
      "Find a teacher who will be the advisor and a few students to start it with",
      "Pick a regular meeting time and plan your first few meetings",
    ],
  },
  {
    id: "app",
    title: "Build an app or website",
    summary: "Make something that solves a small problem for people you know.",
    steps: [
      "Pick one problem and talk to a few people who have it",
      "Build the simplest version that works, using free tools and tutorials",
      "Have those people try it, then fix what doesn't work for them",
    ],
  },
  {
    id: "business",
    title: "Run a small business",
    summary: "Sell a product or service, such as tutoring, baking or design work.",
    steps: [
      "Choose what to sell and work out what it costs you to make or do",
      "Ask a parent or guardian to help with any local permits and payment accounts",
      "Find your first few customers and keep track of what you earn and spend",
    ],
  },
  {
    id: "service",
    title: "Organize a community service project",
    summary: "Take on a need in your neighborhood, such as a food drive or a cleanup.",
    steps: [
      "Talk to a local group already working on the need and ask what would help",
      "Set a clear goal and date, and recruit people to help",
      "Run it, then share what you did with the people who helped",
    ],
  },
  {
    id: "research",
    title: "Do independent research",
    summary: "Pick a question you're curious about and try to answer it yourself.",
    steps: [
      "Narrow your topic to one question you could realistically answer in a summer",
      "Ask a teacher to look at your plan, and read what's already been written",
      "Collect your information, write up what you found, and share it",
    ],
  },
];
