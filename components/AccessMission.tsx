export default function AccessMission() {
  return (
    <section className="py-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Great college guidance shouldn&apos;t depend on what you can afford.
        </h2>
        <p className="mt-4 text-sm text-slate-500 sm:text-base">
          CollegeScout brings college research and planning into one place, so students, families,
          and the counselors who support them can explore options with clear, reliable
          information.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
          CollegeScout was started by a high school student who saw how hard it was to find
          complete college information in one place, and wanted to build something any student or
          family could use.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
          Our data comes from public sources, including Common Data Sets, IPEDS, College
          Scorecard, and college websites. When information isn&apos;t available, we say so rather
          than guess.
        </p>
        <div className="mx-auto mt-6 max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-500">
          <span className="font-bold text-slate-700">Starting at a California community college?</span>{" "}
          It&apos;s one of the most common routes to a UC or CSU. CollegeScout doesn&apos;t cover
          transfer pathways yet, but{" "}
          <a
            href="https://assist.org/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gold-600 hover:underline"
          >
            ASSIST
          </a>
          , California&apos;s official transfer planning tool, shows which courses transfer to each
          campus.
        </div>
      </div>
    </section>
  );
}
