/**
 * Two lines, sized as two voices rather than a title and a caption.
 *
 * Typography notes, since these numbers are deliberate:
 * - The headline sits in a max-w-4xl measure with `text-balance` so it breaks
 *   into two even lines instead of stranding "know to look for." on its own.
 * - The second line runs at roughly half the headline, not a third. At 20px
 *   semibold it read as a tag under a title; at 28-30px medium it reads as the
 *   claim the rest of the page goes on to argue.
 * - Padding is tighter than it was, so the block hugs two lines of text instead
 *   of leaving a pool of empty navy beneath them.
 *
 * No button and no facts strip: the page below makes its case before asking for
 * anything, and the counts and sourcing rules belong on /about-data.
 */
export default function HomeHero() {
  // Slightly more room above than below: a centred text block reads as sitting
  // high when the padding is symmetrical.
  return (
    <section className="overflow-hidden rounded-3xl border border-navy-700 bg-navy-900 px-6 pb-14 pt-16 text-white shadow-card ring-1 ring-inset ring-white/5 sm:px-12 sm:pb-16 sm:pt-20">
      <div className="mx-auto max-w-4xl text-center">
        {/* Non-breaking space keeps "didn't know" together — left to itself the
            balancer split the phrase across the two lines. */}
        <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[58px]">
          Find colleges you didn&apos;t&nbsp;know to look for.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-xl font-medium leading-snug text-gold-400 sm:text-[34px]">
          A college is more than its ranking.
        </p>
      </div>
    </section>
  );
}
