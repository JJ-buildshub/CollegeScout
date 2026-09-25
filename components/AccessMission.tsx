/**
 * Closes the homepage with the reference material: where the numbers come from,
 * and the one major pathway CollegeScout doesn't cover yet. The mission and
 * founder story that used to open this section now run near the top of the page
 * (WhatCollegeScoutIs), before the visitor is asked to do anything.
 */
export default function AccessMission() {
  return (
    <section className="py-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
          Where our information comes from.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
          Our data comes from public sources, including Common Data Sets, IPEDS, College
          Scorecard, and college websites. When information isn&apos;t available, we say so rather
          than guess.
        </p>
      </div>
    </section>
  );
}
