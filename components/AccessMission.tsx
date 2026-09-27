import { colleges } from "@/lib/colleges";

/**
 * Closes the homepage with the reference material: how big the directory is,
 * where the numbers come from, and the standing promise to say when something
 * isn't known.
 *
 * The count is read from the records rather than written down, so it can't drift
 * as schools are added — and it's the real figure. Rounding 336 up to "almost
 * 350" would be a small lie on the one page whose argument is that every number
 * here is checkable.
 */
export default function AccessMission() {
  const publicCount = colleges.filter((c) => ["Public", "UC", "CSU"].includes(c.system)).length;
  // DC is stored in the `state` field but isn't a state. Counting the raw set
  // and then writing "and DC" claimed 51 states (there are 50) and counted DC
  // twice, so it's pulled out of the number and named in words instead.
  const stateValues = new Set(colleges.map((c) => c.state).filter(Boolean));
  const includesDc = stateValues.delete("DC");
  const states = stateValues.size;
  // Rounded DOWN to the ten below, so "over N" is always true — at 336 that's
  // 330, and it stays true as schools are added rather than quietly becoming a
  // claim we've outgrown.
  const roundedFloor = Math.floor((colleges.length - 1) / 10) * 10;

  return (
    <section className="py-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
          Where our information comes from.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
          Our data comes from public sources, including Common Data Sets, IPEDS, College
          Scorecard, and college websites. When information isn&apos;t available, we say so rather
          than guess.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-xs text-slate-500">
          <span className="font-semibold text-navy-900">
            Over {roundedFloor} colleges in the database
          </span>{" "}
          &mdash; {publicCount} public and {colleges.length - publicCount} private, across all{" "}
          {states} states{includesDc ? " and DC" : ""}. Chosen from federal IPEDS data by size and programmes offered,
          never by ranking.
        </p>
      </div>
    </section>
  );
}
