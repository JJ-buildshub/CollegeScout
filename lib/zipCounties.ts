import raw from "@/data/zip-counties.json";
import type { Scholarship } from "./scholarships";

/**
 * ZIP code to the state and counties it covers, from the Census Bureau's
 * ZCTA-to-county file (see scripts/build-zip-counties.mjs). Only California is
 * loaded so far. The lookup runs in the browser; a ZIP is never sent anywhere.
 */
const zips = (raw as { zips: Record<string, string[]> }).zips;

export type ZipLookup =
  | { status: "empty" }
  | { status: "incomplete" }
  | { status: "found"; zip: string; state: string; counties: string[] }
  /** A California-range ZIP the table lacks: usually a PO box or single-business ZIP. */
  | { status: "unknown-ca"; zip: string }
  /** Outside California, which the table does not cover yet. */
  | { status: "other-state"; zip: string };

export function lookupZip(input: string): ZipLookup {
  const zip = input.replace(/\D/g, "").slice(0, 5);
  if (zip.length === 0) return { status: "empty" };
  if (zip.length < 5) return { status: "incomplete" };
  const row = zips[zip];
  if (row) return { status: "found", zip, state: row[0], counties: row.slice(1) };
  const n = Number(zip);
  return n >= 90000 && n <= 96199 ? { status: "unknown-ca", zip } : { status: "other-state", zip };
}

export type AreaMatch = "covers" | "maybe" | "no" | "any";

/**
 * Whether a program is open to someone in this ZIP. "any" for programs with no
 * area of their own (national ones and local clubs, which exist nearly
 * everywhere).
 */
export function areaMatch(program: Scholarship, place: ZipLookup): AreaMatch {
  if (!program.state) return "any";
  if (place.status === "found") {
    if (place.state !== program.state) return "no";
    if (program.counties) return program.counties.some((c) => place.counties.includes(c)) ? "covers" : "no";
    return program.areaCheck ? "maybe" : "covers";
  }
  if (place.status === "other-state") return "no";
  // A California ZIP we could not place: we know the state, not the county.
  if (place.status === "unknown-ca") return program.counties || program.areaCheck ? "maybe" : "covers";
  return "any";
}
