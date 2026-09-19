import { ExternalLink } from "lucide-react";
import type { FinancialSnapshot as FinancialSnapshotType } from "@/lib/types";

function formatUsd(n: number | null): string {
  if (n === null) return "Not publicly reported";
  return `$${n.toLocaleString()}`;
}

export default function FinancialSnapshot({ financials }: { financials: FinancialSnapshotType }) {
  const sameRate =
    financials.coaInState !== null && financials.coaInState === financials.coaOutOfState;

  return (
    <div className="space-y-4">
      <div className={sameRate ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-600">
            {sameRate ? "Total Cost of Attendance" : "In-State COA"}
          </div>
          <div className="mt-0.5 text-lg font-bold text-navy-900">{formatUsd(financials.coaInState)}</div>
        </div>
        {!sameRate && (
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-600">Out-of-State COA</div>
            <div className="mt-0.5 text-lg font-bold text-navy-900">{formatUsd(financials.coaOutOfState)}</div>
          </div>
        )}
      </div>

      {financials.netPriceCalculatorUrl && (
        <a
          href={financials.netPriceCalculatorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
        >
          Run the Net Price Calculator <ExternalLink className="h-3.5 w-3.5" />
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
