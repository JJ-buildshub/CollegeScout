export default function AccessMission() {
  return (
    <section className="py-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Great college guidance shouldn&apos;t depend on what you can afford.
        </h2>
        <p className="mt-4 text-sm text-slate-500 sm:text-base">
          CollegeScout was built to make high-quality college research and planning accessible to
          students and families — without requiring an expensive private counselor.
        </p>
        <p className="mx-auto mt-6 max-w-xl border-t border-slate-100 pt-6 text-xs text-slate-400">
          CollegeScout is built and maintained by a high school student who didn&apos;t have access
          to a paid college counselor either. Every number on this site comes from public sources
          — Common Data Sets, IPEDS, College Scorecard, and college websites — and every gap in the
          data is labeled instead of guessed at.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-xs text-slate-400">
          Planning to start at a community college? California&apos;s CCC transfer pathways (like
          ADT and IGETC) aren&apos;t in this dataset yet — but they&apos;re one of the most reliable
          ways to reach a UC or CSU. We can&apos;t compare specific transfer pathways per school
          here yet, but{" "}
          <a href="https://assist.org" target="_blank" rel="noreferrer" className="font-semibold text-gold-600 hover:underline">
            assist.org
          </a>{" "}
          (California&apos;s official transfer tool) can.
        </p>
      </div>
    </section>
  );
}
