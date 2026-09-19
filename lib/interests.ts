import type { College } from "./types";
import { admitRateTier, displayedAdmitRate } from "./colleges";

export interface Interest {
  id: string;
  label: string;
  /** One line, shown under the label on the homepage interest cards. */
  subtitle: string;
  keywords: string[];
}

/**
 * Curated interest taxonomy shown as homepage cards and used to filter the
 * Directory. Keywords are matched as case-insensitive substrings against a
 * college's careerMajorTags/impactedMajors fields — there is no separate
 * "interest" field in the data model, so this taxonomy is the only layer
 * that maps a plain-language interest to what's actually tagged per school.
 * Every keyword set here was checked against the real data before being
 * written (see the "Task 2" entry in OVERNIGHT_REPORT.md for match counts
 * per interest) — none are guesses.
 */
export const INTEREST_TAXONOMY: Interest[] = [
  { id: "engineering", label: "Engineering", subtitle: "Build things that work", keywords: ["Engineering"] },
  {
    id: "cs-ai",
    label: "Computer Science & AI",
    subtitle: "Code, apps, and smart systems",
    keywords: ["Computer Science", "Artificial Intelligence", "Informatics", "Cybersecurity", "Computing"],
  },
  {
    id: "data-science",
    label: "Data Science",
    subtitle: "Find patterns in numbers",
    keywords: ["Data Science", "Machine Learning", "Data Analytics"],
  },
  {
    id: "business",
    label: "Business",
    subtitle: "Start, run, or grow something",
    keywords: ["Business", "Accounting", "Accountancy", "Entrepreneurship"],
  },
  { id: "finance", label: "Finance", subtitle: "Money, markets, and investing", keywords: ["Finance", "Financial"] },
  {
    id: "medicine-health",
    label: "Medicine & Health",
    subtitle: "Care for people's health",
    keywords: [
      "Biology",
      "Biological Sciences",
      "Health Sciences",
      "Public Health",
      "Pre-Med",
      "Human Biology",
      "Medicine",
      "Medical",
    ],
  },
  { id: "nursing", label: "Nursing", subtitle: "Hands-on patient care", keywords: ["Nursing"] },
  { id: "psychology", label: "Psychology", subtitle: "How people think and act", keywords: ["Psychology"] },
  {
    id: "design-architecture",
    label: "Design & Architecture",
    subtitle: "Shape spaces and products",
    keywords: ["Architecture", "Design"],
  },
  {
    id: "art-film-music",
    label: "Art, Film & Music",
    subtitle: "Create and perform",
    keywords: [
      "Fine Arts",
      "Visual and Performing Arts",
      "Cinematic Arts",
      "Film",
      "Music",
      "Art History",
      "Art Conservation",
      "Studio Art",
      "Performing Arts",
      "Media Arts",
      "Art & Design",
      "Art & Architecture",
      "Art and Digital Media",
    ],
  },
  {
    id: "games-interactive",
    label: "Games & Interactive Media",
    subtitle: "Design worlds people play",
    keywords: ["Game Design", "Games and", "Interactive Media", "Playable Media"],
  },
  {
    id: "environment-climate",
    label: "Environment & Climate",
    subtitle: "Protect the planet",
    keywords: ["Environmental Science", "Environmental Studies", "Sustainability", "Climate"],
  },
  {
    id: "law-policy",
    label: "Law & Public Policy",
    subtitle: "Rules, rights, and justice",
    keywords: ["Pre-Law", "Political Science", "Government", "Public Policy", "Public Affairs", "Politics", "Criminal Justice"],
  },
  { id: "education", label: "Education", subtitle: "Teach and mentor", keywords: ["Education", "Teaching"] },
  {
    id: "sports-movement",
    label: "Sports & Movement",
    subtitle: "Kinesiology, sports science, and coaching",
    keywords: ["Kinesiology", "Exercise Science", "Sport Management", "Sports Management", "Sports Business"],
  },
  {
    id: "media-communication",
    label: "Media & Communication",
    subtitle: "Tell stories that reach people",
    keywords: ["Communication", "Journalism", "Media"],
  },
  {
    id: "science",
    label: "Science",
    subtitle: "Biology, chemistry, and physics",
    keywords: ["Biology", "Biological", "Chemistry", "Physics"],
  },
];

/** Shown by default on the homepage; the rest live behind "Show more". */
export const DEFAULT_INTEREST_IDS = [
  "engineering",
  "cs-ai",
  "data-science",
  "business",
  "medicine-health",
  "psychology",
];

/** A student can explore up to this many interests at once. */
export const MAX_SELECTED_INTERESTS = 3;

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

/** True when the college independently satisfies every selected interest (not necessarily via the same program). */
export function matchesAllInterests(college: College, interestIds: string[]): boolean {
  return interestIds.length > 0 && interestIds.every((id) => matchesInterest(college, id));
}

function trimAttribution(entry: string): string {
  return entry.split(" — ")[0].split(" (")[0].trim();
}

/**
 * Returns the single program/pathway entry that genuinely combines every
 * selected interest at once (e.g. one entry mentioning both a Data Science
 * and a Business keyword) — as opposed to the college merely offering each
 * interest separately. Checks interdisciplinaryPathways first (usually a
 * named joint-degree), then flagshipPrograms names. `null` if no single
 * entry covers all of them — this is the common case for 2+ interests,
 * since true joint/combined programs are rare, and essentially nonexistent
 * for 3-way combinations.
 */
export function getCombinedProgramLabel(college: College, interestIds: string[]): string | null {
  if (interestIds.length < 2) return null;
  const interests = interestIds.map(getInterestById).filter((i): i is Interest => !!i);
  if (interests.length !== interestIds.length) return null;

  const pools = [
    college.careerMajorTags.interdisciplinaryPathways.filter(isDegreePathway),
    college.flagshipPrograms.map((p) => p.name),
  ];
  for (const pool of pools) {
    const matches = pool.filter((entry) => {
      const lower = entry.toLowerCase();
      return interests.every((interest) => interest.keywords.some((kw) => lower.includes(kw.toLowerCase())));
    });
    if (matches.length > 0) {
      const best = matches.reduce((a, b) => (b.length > a.length ? b : a));
      return trimAttribution(best);
    }
  }
  return null;
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

/**
 * How specifically a college's data ties it to an interest: 1 = a named
 * interdisciplinary/joint program, 2 = a general department/major tag, 3 =
 * only the (weaker) impacted-majors list. Lower is preferred within a slate,
 * but this alone is a poor sole ordering — for most interests the large
 * majority of matches land in tier 1, so it needs to be combined with a
 * second axis (see `pickDiverseSlate`) to avoid every result set looking the
 * same regardless of interest.
 */
export function getMatchTier(college: College, interestId: string): number {
  const interest = getInterestById(interestId);
  if (!interest) return 4;
  const hits = (pool: string[]) =>
    pool.filter(isDegreePathway).some((e) => interest.keywords.some((kw) => e.toLowerCase().includes(kw.toLowerCase())));
  if (hits(college.careerMajorTags.interdisciplinaryPathways)) return 1;
  if (hits(college.careerMajorTags.primaryDisciplines)) return 2;
  if (hits(college.impactedMajors)) return 3;
  return 4;
}

function stateOf(college: College): string {
  return college.location.split(",").pop()?.trim() ?? "";
}

/**
 * Picks a deliberately varied slate of up to `limit` colleges from a set of
 * already-confirmed matches, instead of a single straight sort — round-robins
 * across the site's existing admit-rate tiers (Ultra-Selective/Highly
 * Selective/Selective/Accessible, from `admitRateTier`) so a student sees a
 * genuine spread of selectivity rather than six similar schools, breaking
 * ties within a tier by match specificity then name, and preferring not to
 * repeat a state when an alternative in the same admit-rate tier exists.
 * Deterministic — no randomness, no new data fields.
 */
export function pickDiverseSlate(
  candidates: { college: College; tier: number }[],
  limit: number
): College[] {
  const bandOrder = ["Ultra-Selective", "Highly Selective", "Selective", "Accessible"] as const;
  const groups: Record<(typeof bandOrder)[number], { college: College; tier: number }[]> = {
    "Ultra-Selective": [],
    "Highly Selective": [],
    Selective: [],
    Accessible: [],
  };
  for (const c of candidates) {
    groups[admitRateTier(displayedAdmitRate(c.college).value) as (typeof bandOrder)[number]].push(c);
  }
  for (const band of bandOrder) {
    groups[band].sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.college.name.localeCompare(b.college.name);
    });
  }

  const nextIndex: Record<(typeof bandOrder)[number], number> = {
    "Ultra-Selective": 0,
    "Highly Selective": 0,
    Selective: 0,
    Accessible: 0,
  };
  const picked: College[] = [];
  const usedStates = new Set<string>();
  let stalledRounds = 0;

  while (picked.length < limit && stalledRounds < bandOrder.length * 2) {
    let addedThisRound = false;
    for (const band of bandOrder) {
      if (picked.length >= limit) break;
      const list = groups[band];
      let candidateIndex = -1;
      for (let i = nextIndex[band]; i < list.length; i++) {
        if (!usedStates.has(stateOf(list[i].college))) {
          candidateIndex = i;
          break;
        }
      }
      // No same-tier alternative in a fresh state — reuse the next one anyway.
      if (candidateIndex === -1 && nextIndex[band] < list.length) candidateIndex = nextIndex[band];
      if (candidateIndex !== -1 && candidateIndex < list.length) {
        const chosen = list[candidateIndex];
        picked.push(chosen.college);
        usedStates.add(stateOf(chosen.college));
        nextIndex[band] = candidateIndex + 1;
        addedThisRound = true;
      }
    }
    stalledRounds = addedThisRound ? 0 : stalledRounds + 1;
  }

  return picked;
}
