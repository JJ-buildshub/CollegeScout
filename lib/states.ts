// Canonical US state list (2-letter USPS code + full name) used for the home
// state dropdown, display, and comparing a visitor's stored home state
// against a college's `state` field. `data/colleges.json`'s `state` field
// was populated once from this same table via a migration script; new
// records should set `state` directly rather than parsing `location`.

export interface UsState {
  code: string;
  name: string;
}

export const US_STATES: UsState[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const CODE_SET = new Set(US_STATES.map((s) => s.code));
const NAME_TO_CODE = new Map(US_STATES.map((s) => [s.name.toLowerCase(), s.code]));

export function isValidStateCode(code: string): boolean {
  return CODE_SET.has(code);
}

export function stateName(code: string): string | undefined {
  return US_STATES.find((s) => s.code === code)?.name;
}

/**
 * Best-effort parse of a state out of a free-text location string (e.g.
 * "Berkeley, CA" or "Villanova, Pennsylvania (Philadelphia Main Line)").
 * Only used by the one-time data migration and as a fallback for hand-edited
 * records — every `College.state` value should already be a clean code.
 */
export function parseStateFromLocation(location: string): string | null {
  const rawTail = location.split(",").pop() ?? "";
  const tail = rawTail.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const upper = tail.toUpperCase();
  if (CODE_SET.has(upper)) return upper;
  return NAME_TO_CODE.get(tail.toLowerCase()) ?? null;
}
