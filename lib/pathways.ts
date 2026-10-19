import rawPathways from "@/data/pathways.json";

/**
 * Beyond Grades content, from data/pathways.json. A card links to a page
 * only when that file has a page for its slug; every other card is shown as
 * coming soon, so adding a pathway is a data edit, never a code change.
 */
export type PathwayCategoryId = "music" | "sports" | "activity-scholarships" | "activities-valued";
export type PathwayBadge = "Mainstream" | "Niche" | "Scholarships" | "Counts in your app";

export interface PathwayCategory {
  id: PathwayCategoryId;
  label: string;
  title: string;
  summary: string;
}

export interface PathwayCard {
  slug: string;
  category: PathwayCategoryId;
  badge: PathwayBadge;
  title: string;
  summary: string;
  starts: string;
}

export interface PathwaySource {
  label: string;
  url: string;
  accessed: string;
  evidence: string[];
  /** The page refuses automated requests; a person read it in a browser on `accessed`. */
  manual?: boolean;
}

export interface PathwayPage {
  badges: string[];
  title: string;
  intro: string;
  facts: { label: string; value: string }[];
  options: { title: string; description: string; submit: string[]; fitsIf: string }[];
  timeline: { stage: string; text: string }[];
  needs: { id: string; label: string }[];
  callout: { title: string; body: string };
  myths: { myth: string; truth: string }[];
  sources: PathwaySource[];
  directoryLinks: { label: string; href: string }[];
}

interface PathwaysFile {
  checked: string;
  categories: PathwayCategory[];
  cards: PathwayCard[];
  pages: Record<string, PathwayPage>;
}

const data = rawPathways as unknown as PathwaysFile;

export const pathwayCategories = data.categories;
export const pathwayCards = data.cards;

export function getPathwayPage(slug: string): PathwayPage | undefined {
  return data.pages[slug];
}

export function hasPathwayPage(slug: string): boolean {
  return slug in data.pages;
}

export function livePathwaySlugs(): string[] {
  return Object.keys(data.pages);
}

export function getPathwayCard(slug: string): PathwayCard | undefined {
  return data.cards.find((c) => c.slug === slug);
}

export function getPathwayCategory(id: PathwayCategoryId): PathwayCategory | undefined {
  return data.categories.find((c) => c.id === id);
}

/** "2026-10-19" -> "Oct 2026". Parsed by hand so the server's time zone can't shift the month. */
export function monthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[month - 1]} ${year}`;
}
