import type { College } from "./types";

export interface Interest {
  id: string;
  label: string;
  keywords: string[];
}

/**
 * Curated interest taxonomy shown as homepage chips and used to filter the
 * Directory. Keywords are matched as case-insensitive substrings against a
 * college's careerMajorTags/impactedMajors fields — there is no separate
 * "interest" field in the data model, so this taxonomy is the only layer
 * that maps a plain-language interest to what's actually tagged per school.
 */
export const INTEREST_TAXONOMY: Interest[] = [
  {
    id: "data-science-business",
    label: "Data Science + Business",
    // Deliberately specific (named joint-degree phrases only, not bare "Data
    // Science" or "Machine Learning") — this interest is a cross-disciplinary
    // combination, and generic single-field tags would pull in schools whose
    // CS department happens to mention "Machine Learning" with no business
    // program involved at all.
    keywords: [
      "Business Analytics",
      "Business Intelligence",
      "Artificial Intelligence for Business",
      "Management Information Systems",
      "Business + Data Science",
      "Statistics & Machine Learning",
      "Statistics and Machine Learning",
    ],
  },
  {
    id: "cs-ai",
    label: "Computer Science / AI",
    keywords: ["Computer Science", "Artificial Intelligence", "Informatics", "Cybersecurity", "Computing"],
  },
  { id: "engineering", label: "Engineering", keywords: ["Engineering"] },
  {
    id: "premed-health",
    label: "Pre-Med / Health",
    keywords: ["Biology", "Biological Sciences", "Health Sciences", "Public Health", "Pre-Med", "Human Biology"],
  },
  { id: "nursing", label: "Nursing", keywords: ["Nursing"] },
  {
    id: "business-finance",
    label: "Business / Finance",
    keywords: ["Business", "Finance", "Accounting", "Accountancy"],
  },
  { id: "psychology", label: "Psychology", keywords: ["Psychology"] },
  { id: "education-teaching", label: "Education / Teaching", keywords: ["Education", "Teaching"] },
  {
    id: "communications-media",
    label: "Communications / Media",
    keywords: ["Communication", "Journalism", "Media"],
  },
  {
    id: "arts-music",
    label: "Arts / Music",
    keywords: ["Visual and Performing Arts", "Fine Arts", "Music", "Cinematic Arts", "Film"],
  },
  { id: "design-architecture", label: "Design / Architecture", keywords: ["Architecture", "Design"] },
  {
    id: "environmental-science",
    label: "Environmental Science",
    keywords: ["Environmental Science", "Environmental Studies", "Sustainability"],
  },
  {
    id: "social-sciences",
    label: "Social Sciences",
    keywords: ["Social Sciences", "Sociology", "Anthropology"],
  },
  {
    id: "pre-law",
    label: "Pre-Law",
    keywords: ["Pre-Law", "Political Science", "Government", "Criminal Justice"],
  },
  {
    id: "kinesiology-sports",
    label: "Kinesiology / Sports Science",
    keywords: ["Kinesiology", "Sports Science", "Sport Management", "Exercise Science"],
  },
];

/** Shown by default on the homepage; the rest live behind "Show more". */
export const DEFAULT_INTEREST_IDS = [
  "data-science-business",
  "cs-ai",
  "engineering",
  "business-finance",
  "psychology",
  "premed-health",
];

export function getInterestById(id: string): Interest | undefined {
  return INTEREST_TAXONOMY.find((i) => i.id === id);
}

// A "certificate" is a supplementary credential, not a degree pathway — excluding
// it keeps "One interest. Many paths." focused on programs a student would
// actually major/minor in, not add-on credentials layered onto an unrelated major.
function isDegreePathway(entry: string): boolean {
  return !entry.toLowerCase().includes("certificate");
}

function searchableStrings(college: College): string[] {
  return [
    ...college.careerMajorTags.primaryDisciplines,
    ...college.careerMajorTags.interdisciplinaryPathways,
    ...college.impactedMajors,
  ].filter(isDegreePathway);
}

export function matchesInterest(college: College, interestId: string): boolean {
  const interest = getInterestById(interestId);
  if (!interest) return false;
  const haystacks = searchableStrings(college).map((s) => s.toLowerCase());
  return interest.keywords.some((kw) => {
    const needle = kw.toLowerCase();
    return haystacks.some((h) => h.includes(needle));
  });
}

function trimAttribution(entry: string): string {
  return entry.split(" — ")[0].split(" (")[0].trim();
}

/**
 * A short, human-readable pathway label for how this college addresses the
 * given interest — e.g. "BS in Business + Data Science" for UIUC under
 * "Data Science + Business". Prefers interdisciplinaryPathways (usually a
 * specific joint-degree name) over the broader primaryDisciplines list.
 */
export function getPathwayLabel(college: College, interestId: string): string | null {
  const interest = getInterestById(interestId);
  if (!interest) return null;
  const pools = [
    college.careerMajorTags.interdisciplinaryPathways.filter(isDegreePathway),
    college.careerMajorTags.primaryDisciplines.filter(isDegreePathway),
  ];
  for (const pool of pools) {
    // A pool can contain both a generic one-word tag (e.g. "Data Science") and a
    // more specific joint-degree name (e.g. "BS in Business + Data Science
    // (Gies College of Business)") that also matches. Prefer the longest
    // matching entry in each pool — it's reliably the more descriptive one.
    const matches = pool.filter((entry) =>
      interest.keywords.some((kw) => entry.toLowerCase().includes(kw.toLowerCase()))
    );
    if (matches.length > 0) {
      const best = matches.reduce((a, b) => (b.length > a.length ? b : a));
      return trimAttribution(best);
    }
  }
  return null;
}

export function countMatches(colleges: College[], interestId: string): number {
  return colleges.filter((c) => matchesInterest(c, interestId)).length;
}
