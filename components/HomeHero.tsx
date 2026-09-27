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
    <section className="hero-surface overflow-hidden rounded-3xl border border-white/10 px-5 pb-7 pt-8 text-white shadow-card ring-1 ring-inset ring-white/5 sm:px-12 sm:pb-10 sm:pt-12">
      <div className="max-w-3xl">
        {/* Non-breaking space keeps "didn't know" together — left to itself the
            balancer split the phrase across the two lines. */}
        <h1 className="font-display text-balance text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[56px] sm:leading-[1.02]">
          Find colleges you didn&apos;t&nbsp;know to look for.
        </h1>
        <p className="mt-3 max-w-xl text-balance text-[15px] font-medium leading-snug hero-sub sm:mt-5 sm:text-[22px]">
          Built by a high school student, from the numbers colleges publish themselves.
        </p>
      </div>
    </section>
  );
}
