import rawColleges from "@/data/colleges.json";
import type { College } from "./types";

export const colleges = rawColleges as unknown as College[];

export function getCollegeById(id: string): College | undefined {
  return colleges.find((c) => c.id === id);
}

export const SYSTEMS = ["UC", "CSU", "Private", "Out-of-State Public"] as const;

export const TESTING_POLICIES = ["Test-Free", "Test-Required", "Test-Optional", "Test-Blind"] as const;

export function formatPercent(value: number | null): string {
  if (value === null) return "Not publicly reported";
  return `${Math.round(value * 100)}%`;
}

export function admitRateTier(rate: number): string {
  if (rate < 0.15) return "Ultra-Selective";
  if (rate < 0.35) return "Highly Selective";
  if (rate < 0.6) return "Selective";
  return "Accessible";
}
