import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the data",
  description:
    "Where CollegeScout figures come from, how each one is verified, and what has not been confirmed yet.",
  alternates: { canonical: "/about-data" },
  openGraph: { title: "About the data | CollegeScout", description: "Where CollegeScout figures come from, how each one is verified, and what has not been confirmed yet.", url: "/about-data" },
};

import Link from "next/link";

export default function AboutDataPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          About our data
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Where the numbers on CollegeScout come from, and what we don&apos;t yet know.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div>
          <h2 className="text-sm font-bold text-navy-900">College Scorecard</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Admit rate and tuition figures come from the U.S. Department
            of Education&apos;s College Scorecard, a federal dataset built from schools&apos; own reporting.
            Every Scorecard-sourced number on this site is labeled with its source and award year
            directly under the figure.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-bold text-navy-900">University-reported data</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Fields Scorecard doesn&apos;t publish — GPA and test score ranges, in-state/out-of-state
            admit rate splits, programs, and campus details — come from a mix of
            each school&apos;s own Common Data Set, admissions pages, and other public sources. Some of
            these have been individually verified against a specific, dated source; most have not
            been yet. We&apos;re working through them school by school, and figures without a confirmed
            source are approximate rather than guaranteed exact.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-bold text-navy-900">Career outcomes</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            We don&apos;t show them. Placement rates and starting salaries are published
            inconsistently — different cohorts, different time windows, different response rates —
            and we&apos;d rather show nothing than a number we can&apos;t point to a source for.
            They&apos;ll come back once each one is verified against the school&apos;s own reporting.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-bold text-navy-900">Found something wrong?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Tell us and we&apos;ll check it against the school&apos;s own page and correct it.
            Questions and feedback are welcome at the same address.{" "}
            <a
              href="mailto:hello.collegescout@gmail.com"
              className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
            >
              hello.collegescout@gmail.com
            </a>
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        <Link href="/directory" className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700">
          Back to the Directory
        </Link>
      </p>
    </div>
  );
}
