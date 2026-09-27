/**
 * The problem, set as an editorial spread rather than a centred card: the claim
 * on the left at display size, the explanation beside it. Every other section on
 * this page was a centred heading over a grid, which is what made the page read
 * as a template.
 */
export default function AccessMissionStatement() {
  return (
    <section className="py-2">
      <div className="grid max-w-4xl gap-3 border-l-4 border-gold-500 pl-5 sm:pl-8 lg:grid-cols-[1fr_0.85fr] lg:items-end lg:gap-8">
        <h2 className="font-display text-balance text-xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-[30px]">
          Great college guidance shouldn&apos;t depend on what you can afford.
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Families who can hire a private counsellor get someone to read the fine print. Everyone
          else gets rankings.
        </p>
      </div>
    </section>
  );
}
