import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import type { FinancialSnapshot as FinancialSnapshotType } from "@/lib/types";

function formatUsd(n: number | null): string {
  if (n === null) return "Not publicly reported";
  return `$${n.toLocaleString()}`;
}

export default function FinancialSnapshot({
  financials,
  ipedsUnitId,
  sourceMark,
}: {
  financials: FinancialSnapshotType;
  ipedsUnitId: number | null;
  /** Footnote marker for the cost figures, when they carry a recorded source. */
  sourceMark?: ReactNode;
}) {
  const sameRate =
    financials.coaInState !== null && financials.coaInState === financials.coaOutOfState;

  // Every school gets a calculator link: the school's own when we have it,
  // otherwise its federal College Navigator page, which lists the school's
  // net price calculator. No URL is guessed.
  const calculator = financials.netPriceCalculatorUrl
    ? { href: financials.netPriceCalculatorUrl, label: "Estimate what your family would pay" }
    : ipedsUnitId
      ? {
          href: `https://nces.ed.gov/collegenavigator/?id=${ipedsUnitId}`,
          label: "Find this school\u2019s net price calculator",
        }
      : null;

  return (
    <div className="space-y-4">
      <div className={sameRate ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-600">
            {sameRate ? "Cost of attendance, per year" : "In-state cost of attendance"}
          </div>
          <div className="mt-0.5 text-2xl font-extrabold tabular-nums text-navy-900">
            {formatUsd(financials.coaInState)}
            {sourceMark}
          </div>
        </div>
        {!sameRate && (
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-600">Out-of-state cost of attendance</div>
            <div className="mt-0.5 text-2xl font-extrabold tabular-nums text-navy-900">
              {formatUsd(financials.coaOutOfState)}
              {sourceMark}
            </div>
          </div>
        )}
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        This is the full yearly cost before any financial aid. What your family would actually pay
        depends on your income and the aid the school offers. Talk with your school counselor and the
        college&apos;s financial aid office, or use the school&apos;s net price calculator to get an estimate.
        Cost figures are approximate, so confirm current numbers on the college&apos;s website.
      </p>

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

      {financials.meritAidNote && (
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          {financials.meritAidNote}
        </p>
      )}
    </div>
  );
}
