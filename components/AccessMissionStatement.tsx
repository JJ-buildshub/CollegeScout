/**
 * The mission, given its own dark band partway down the homepage. It's the
 * emotional centre of the page rather than a data section, so it gets the same
 * navy treatment as the hero — a deliberate break in the light run of sections
 * above and below it. The data-sourcing detail stays at the bottom of the page
 * (AccessMission); this section is only about why CollegeScout exists.
 */
export default function AccessMissionStatement() {
  return (
    <section className="overflow-hidden rounded-3xl border border-navy-700 bg-navy-900 px-6 py-14 text-white shadow-card ring-1 ring-inset ring-white/5 sm:px-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
          Great college guidance shouldn&apos;t depend on what you can afford.
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-base">
          Families who can hire a private counsellor get someone to read the fine print for them.
          Everyone else gets rankings. CollegeScout puts the same research in front of every
          student.
        </p>
      </div>

      {/* The origin story stands on its own rather than sitting under a label —
          it's the reason to believe the line above it. */}
      <div className="mx-auto mt-8 max-w-xl border-l-2 border-gold-500 pl-5 text-left sm:mt-10">
        <p className="text-sm leading-relaxed text-white sm:text-base">
          CollegeScout was started by a high school student who couldn&apos;t find complete college
          information anywhere in one place, and wanted to build something any student or family
          could use.
        </p>
      </div>
    </section>
  );
}
