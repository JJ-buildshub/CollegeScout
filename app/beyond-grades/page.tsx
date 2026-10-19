import type { Metadata } from "next";
import { Music, Trophy, Award, Sparkles } from "lucide-react";
import { livePathwaySlugs, pathwayCards, pathwayCategories, type PathwayCategoryId } from "@/lib/pathways";
import PathwayExplorer from "@/components/PathwayExplorer";

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
  "activity-scholarships": Award,
  "activities-valued": Sparkles,
};

export default function PathwaysPage() {
  return (
    <div className="space-y-10">
      <section className="hero-surface overflow-hidden rounded-3xl border border-white/10 px-5 pb-7 pt-8 text-white shadow-card ring-1 ring-inset ring-white/5 sm:px-12 sm:pb-10 sm:pt-12">
        <div className="max-w-3xl">
          <h1 className="font-display text-balance text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[48px] sm:leading-[1.04]">
            Your talent can open a second track into college
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-[15px] font-medium leading-snug hero-sub sm:mt-5 sm:text-xl">
            Music, sports and the activities you care about can add a second piece to your application. Here&apos;s what each path
            involves and when it happens.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border-l-4 border-gold-500 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Not a shortcut</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          You still apply to each college the regular way. These paths add a second piece on top: an audition, a coach&apos;s
          support, a portfolio or a scholarship application.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">Four kinds of pathways</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
