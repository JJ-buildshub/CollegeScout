import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, ExternalLink, Lightbulb } from "lucide-react";
import AddPathwayToPlanButton from "@/components/AddPathwayToPlanButton";
import { getPathwayCard, getPathwayCategory, getPathwayPage, livePathwaySlugs, monthYear } from "@/lib/pathways";

// Only slugs with a page in data/pathways.json exist; a coming-soon card's slug is a 404, not an empty page.
export const dynamicParams = false;

export function generateStaticParams() {
  return livePathwaySlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getPathwayPage(params.slug);
  if (!page) return {};
  const path = `/beyond-grades/${params.slug}`;
  return {
    title: `${page.title} | Beyond Grades`,
    description: page.intro,
    alternates: { canonical: path },
    openGraph: { title: `${page.title} | Beyond Grades | CollegeScout`, description: page.intro, url: path },
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[26px]">{children}</h2>;
}

export default function PathwayPage({ params }: { params: { slug: string } }) {
  const page = getPathwayPage(params.slug);
  if (!page) notFound();
  const card = getPathwayCard(params.slug);
  const category = card ? getPathwayCategory(card.category) : undefined;

  return (
    <article className="space-y-10">
      <header>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500">
          <Link href="/beyond-grades" className="hover:text-navy-900">
            Beyond Grades
          </Link>
          {category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{category.label}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-navy-900">{page.title}</span>
        </nav>
        <div className="mt-4 flex flex-wrap gap-2">
          {page.badges.map((badge, i) => (
            <span
              key={badge}
              className={i === 0 ? "rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-gold-400" : "rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-700"}
            >
              {badge}
            </span>
          ))}
        </div>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-[44px]">{page.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{page.intro}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {page.facts.map((fact) => (
          <div key={fact.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{fact.label}</div>
            <div className="mt-1 text-sm font-bold leading-snug text-navy-900 sm:text-base">{fact.value}</div>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle>Your options</SectionTitle>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {page.options.map((option, i) => (
            <div key={option.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <span className="text-xs font-bold text-gold-600">Option {i + 1}</span>
              <h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-navy-900">{option.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{option.description}</p>
              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">You&apos;d submit</div>
              <ul className="mt-1.5 space-y-1">
                {option.submit.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-sm text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <div className="rounded-xl bg-sand-100 px-3 py-2 text-sm text-slate-600">
                  <span className="font-bold text-navy-900">Fits if: </span>
                  {option.fitsIf}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>When it happens</SectionTitle>
        <ol className="mt-4 grid gap-3 md:grid-cols-5">
          {page.timeline.map((step, i) => (
            <li key={step.stage} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-gold-400">
                  {i + 1}
                </span>
                <span className="text-sm font-extrabold text-navy-900">{step.stage}</span>
              </div>
              <p className="mt-2 text-sm leading-snug text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {page.comparison && (
        <section>
          <SectionTitle>{page.comparison.title}</SectionTitle>
          {page.comparison.note && <p className="mt-1 text-sm text-slate-500">{page.comparison.note}</p>}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-sand-100 text-[11px] font-bold uppercase text-slate-500 sm:text-xs sm:tracking-wide">
                <tr>
                  <th className="px-2 py-2.5 sm:px-4" />
                  {page.comparison.columns.map((column) => (
                    <th key={column} className="px-2 py-2.5 sm:px-4">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {page.comparison.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-2 py-2.5 font-bold text-navy-900 sm:px-4">
                      {row.label}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={i} className={cell.startsWith("No") ? "px-2 py-2.5 text-slate-500 sm:px-4" : "px-2 py-2.5 text-slate-600 sm:px-4"}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <SectionTitle>What you&apos;d need</SectionTitle>
          <ul className="mt-4 space-y-2.5">
            {page.needs.map((need) => (
              <li key={need.id} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300" aria-hidden />
                {need.label}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <AddPathwayToPlanButton slug={params.slug} />
          </div>
        </div>
        <aside className="rounded-2xl bg-navy-900 p-5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-gold-400">
            <Lightbulb className="h-4 w-4" />
          </span>
          <h2 className="mt-3 text-lg font-extrabold">{page.callout.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{page.callout.body}</p>
        </aside>
      </section>

      <section>
        <SectionTitle>Myth vs. what&apos;s true</SectionTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {page.myths.map((pair) => (
            <div key={pair.myth} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Myth</div>
              <p className="mt-0.5 text-sm font-semibold text-slate-600">&ldquo;{pair.myth}&rdquo;</p>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gold-600">What&apos;s true</div>
              <p className="mt-0.5 text-sm leading-relaxed text-navy-900">{pair.truth}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Where to look</SectionTitle>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand-100 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Official page</th>
                <th className="w-32 px-4 py-2.5">Last checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {page.sources.map((source) => (
                <tr key={source.url}>
                  <td className="px-4 py-2.5">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-navy-900 underline-offset-2 hover:text-gold-600 hover:underline"
                    >
                      {source.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{monthYear(source.accessed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle>Find colleges for this path</SectionTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          {page.directoryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-gold-300 bg-gold-50 px-3.5 py-1.5 text-sm font-semibold text-navy-900 hover:bg-gold-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
