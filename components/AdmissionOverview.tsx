import type { College } from "@/lib/types";
import { buildAdmissionOverview } from "@/lib/admissionOverview";

/**
 * A short, plain-language summary of how admission works at this school. Every
 * row is backed by a named source; rows we can't source are simply absent. With
 * fewer than two rows there's nothing worth summarizing, so nothing is shown.
 */
export default function AdmissionOverview({ college }: { college: College }) {
  const rows = buildAdmissionOverview(college);
  if (rows.length < 2) return null;

  return (
    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <h3 className="text-base font-bold text-navy-900">How admission works here</h3>
      <p className="mt-0.5 text-xs text-slate-500">The parts that are specific to this school, in plain language.</p>
      <dl className="mt-4 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[11rem_1fr]">
            <dt className="text-xs font-bold tracking-wide text-slate-500">{row.label}</dt>
            <dd className="text-sm leading-relaxed text-slate-800">
              {row.text}{" "}
              <a
                href={row.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-600"
              >
                {row.source.label}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        A row only appears when we have a source for it. What isn&apos;t listed wasn&apos;t confirmed, which is not the
        same as not required.
      </p>
    </div>
  );
}
