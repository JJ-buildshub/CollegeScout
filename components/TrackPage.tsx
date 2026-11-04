import { livePathwaySlugs, pathwayCards, pathwayCategories } from "@/lib/pathways";
import PathwayExplorer from "@/components/PathwayExplorer";
import { ExploreTabs } from "@/components/SectionTabs";
import PageHeader from "@/components/PageHeader";

/** The tracks shown under Explore. "Activities colleges value" has no track until its pages are written. */
export const TRACKS = {
  music: {
    title: "Music Track",
    href: "/beyond-grades",
    intro: "Some colleges ask musicians for an audition or recording on top of the regular application. Here's what each one asks and when.",
  },
  sports: {
    title: "Sports Track",
    href: "/beyond-grades/sports-track",
    intro: "Some colleges recruit athletes: a coach can support your application, and NCAA rules set when coaches can contact you. Here's how it works and when.",
  },
} as const;

export type TrackId = keyof typeof TRACKS;

export function trackFor(categoryId: string | undefined) {
  return categoryId && categoryId in TRACKS ? TRACKS[categoryId as TrackId] : undefined;
}

export default function TrackPage({ track }: { track: TrackId }) {
  const { title, intro } = TRACKS[track];
  const categories = pathwayCategories.filter((c) => c.id === track);
  const cards = pathwayCards.filter((c) => c.category === track);
  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ExploreTabs />
        <PageHeader eyebrow="Explore" title={title}>
          <p>{intro}</p>
        </PageHeader>
      </div>

      <section className="rounded-2xl border-l-4 border-gold-500 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Not a shortcut</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          You still apply to each college the regular way. These paths add a second piece on top: an audition, a recording, a
          coach&apos;s support or an arts supplement.
        </p>
      </section>

      <section>
        <PathwayExplorer categories={categories} cards={cards} liveSlugs={livePathwaySlugs()} />
      </section>

      <p className="max-w-3xl border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
        Rules change every year. Each pathway page links to the official pages it draws on, with the date they were last
        checked. When a college&apos;s own page says something different, the college&apos;s page wins.
      </p>
    </div>
  );
}
