import type { Metadata } from "next";
import { Music, Trophy, Sparkles } from "lucide-react";
import { livePathwaySlugs, pathwayCards, pathwayCategories, type PathwayCategoryId } from "@/lib/pathways";
import PathwayExplorer from "@/components/PathwayExplorer";
import SectionHeader from "@/components/SectionHeader";

const description =
  "How music, sports and activities can add a second piece to a college application: what each path requires and when it happens.";

export const metadata: Metadata = {
  title: "Beyond Grades",
  description,
  alternates: { canonical: "/beyond-grades" },
  openGraph: { title: "Beyond Grades | CollegeScout", description, url: "/beyond-grades" },
};

const CATEGORY_ICON: Record<PathwayCategoryId, typeof Music> = {
  music: Music,
  sports: Trophy,
  "activities-valued": Sparkles,
};

export default function PathwaysPage() {
  return (
    <div className="space-y-10">
      <SectionHeader icon={Sparkles} label="Ways your talent counts" title="Beyond Grades">
        <p>
          Music, sports and the activities you care about can add a second piece to your application. Here&apos;s what each path
          involves and when it happens.
        </p>
      </SectionHeader>

      <section className="rounded-2xl border-l-4 border-gold-500 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Not a shortcut</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          You still apply to each college the regular way. These paths add a second piece on top: an audition, a recording, a
          coach&apos;s support or an arts supplement.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">Three kinds of pathways</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {pathwayCategories.map((category) => {
            const Icon = CATEGORY_ICON[category.id];
            return (
              <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-navy-900">{category.title}</h3>
                <p className="mt-1 text-sm leading-snug text-slate-500">{category.summary}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">Explore pathways</h2>
        <div className="mt-4">
          <PathwayExplorer categories={pathwayCategories} cards={pathwayCards} liveSlugs={livePathwaySlugs()} />
        </div>
      </section>

      <p className="max-w-3xl border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
        Rules change every year. Each pathway page links to the official pages it draws on, with the date they were last
        checked. When a college&apos;s own page says something different, the college&apos;s page wins.
      </p>
    </div>
  );
}
