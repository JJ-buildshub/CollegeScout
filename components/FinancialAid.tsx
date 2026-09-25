import { ExternalLink } from "lucide-react";
import type { College } from "@/lib/types";

/**
 * Financial aid gets its own section rather than sitting inside Cost, because
 * the two answer different questions: Cost is the school's published price, aid
 * is what happens to it. Deliberately NOT a single "average net price" — that
 * average is taken across every aided student, so it implies a precision no
 * individual family has. College Scorecard publishes the figure split by
 * household income, which is the honest version: a family can find their own
 * row instead of being handed someone else's average.
 */
const BANDS: { key: string; label: string }[] = [
  { key: "0-30000", label: "Under $30,000" },
  { key: "30001-48000", label: "$30,001 – $48,000" },
  { key: "48001-75000", label: "$48,001 – $75,000" },
  { key: "75001-110000", label: "$75,001 – $110,000" },
  { key: "110001-plus", label: "Over $110,000" },
];

function formatUsd(n: number): string {
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
}

export default function FinancialAid({ college }: { college: College }) {
  const band = college.scorecard?.netPriceByIncomeBand ?? null;
  const rows = band?.value
    ? BANDS.filter((b) => typeof band.value?.[b.key] === "number").map((b) => ({
        ...b,
        amount: band.value![b.key],
      }))
    : [];
  const anyNegative = rows.some((r) => r.amount < 0);
  const max = rows.reduce((m, r) => Math.max(m, Math.abs(r.amount)), 0);

  // Every school gets a calculator route: its own when we have it, otherwise the
  // federal College Navigator page, which lists it. No URL is ever guessed.
  const calculator = college.financials.netPriceCalculatorUrl
    ? { href: college.financials.netPriceCalculatorUrl, label: "Estimate what your family would pay" }
    : college.ipedsUnitId
      ? {
          href: `https://nces.ed.gov/collegenavigator/?id=${college.ipedsUnitId}`,
          label: "Find this school’s net price calculator",
        }
      : null;

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      {rows.length > 0 ? (
        <div>
          <h3 className="text-sm font-bold text-navy-900">
            What families actually paid, by household income
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Average for students who received federal aid. Your own figure depends on your family&apos;s
            finances and the aid this school offers you.
          </p>

          <dl className="mt-4 space-y-2.5">
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[9.5rem_1fr_auto] items-center gap-3">
                <dt className="text-xs font-semibold text-slate-600">{r.label}</dt>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${r.amount < 0 ? "bg-gold-500" : "bg-navy-900"}`}
                    style={{ width: max > 0 ? `${Math.max(2, (Math.abs(r.amount) / max) * 100)}%` : "2%" }}
                  />
                </div>
                <dd className="text-right text-sm font-bold tabular-nums text-navy-900">
                  {formatUsd(r.amount)}
                </dd>
              </div>
            ))}
          </dl>

          {anyNegative && (
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              A negative figure means the average aid package was larger than the school&apos;s full
              cost of attendance — those families were paid the difference rather than billed.
            </p>
          )}

          {band?.provenance && (
            <p className="mt-3 text-[11px] text-slate-500">
              {band.provenance.source}, {band.provenance.year}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          This school&apos;s net price by income band isn&apos;t published in College Scorecard, so we
          don&apos;t show one. Use its net price calculator below for an estimate.
        </p>
      )}

      <div className="border-t border-slate-100 pt-5">
        {calculator && (
          <a
            href={calculator.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
          >
            {calculator.label} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          Every school is required to publish a net price calculator. It asks about your family&apos;s
          finances and returns an estimate for you specifically, which is worth more than any average
          on this page. Your school counselor and the college&apos;s financial aid office can also help.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-bold text-navy-900">Scholarships and merit aid</h3>
        {college.financials.meritAidNote ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {college.financials.meritAidNote}
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            We don&apos;t have a confirmed note on merit scholarships at this school. Check its
            financial aid pages rather than assuming either way.
          </p>
        )}
      </div>
    </div>
  );
}
