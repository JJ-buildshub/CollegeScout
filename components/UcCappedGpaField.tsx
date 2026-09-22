"use client";

import { ExternalLink, Info } from "lucide-react";

const UC_GPA_REQUIREMENT_URL =
  "https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/gpa-requirement.html";

/**
 * The only GPA input UC campuses ever use for fit classification (see
 * evaluateUcFit in lib/gpa.ts). Deliberately not derived from anything else
 * in the profile — UC doesn't accept a school-reported unweighted or
 * weighted GPA, or an SAT/ACT score, for admission at all, so comparing
 * either against UC's 3.0/3.4 eligibility minimums or a campus's published
 * GPA range would misrepresent a real UC decision. This field only accepts
 * a number the student calculated themselves, using UC's actual A-G
 * methodology (course-by-course grade points plus eligible honors bonus
 * points) — never computed by CollegeScout.
 */
export default function UcCappedGpaField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <label className="block">
        <div className="text-sm font-bold text-navy-900">
          UC capped weighted GPA <span className="font-normal text-slate-400">(optional)</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Enter this only if you have calculated it using UC&apos;s A-G methodology. CollegeScout does not
          calculate it from your school GPA — your school-reported unweighted or weighted GPA is never
          compared against UC&apos;s eligibility minimums or a campus&apos;s published GPA range.
        </p>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={5}
          step={0.01}
          value={value ?? ""}
          placeholder="e.g. 4.15"
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className="mt-3 w-32 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
        />
      </label>

      <a
        href={UC_GPA_REQUIREMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-navy-700"
      >
        UC&apos;s official GPA calculation guidance <ExternalLink className="h-3 w-3" />
      </a>

      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        {value === null ? (
          <span>
            Without this, UC campuses below show a &quot;Limited-data estimate&quot; from admit rate alone —
            UC doesn&apos;t consider your school-reported GPA or SAT/ACT scores for admission.
          </span>
        ) : (
          <span>UC campuses below compare this number to their published UC-capped GPA range. Your SAT/ACT score is still never used for them.</span>
        )}
      </div>
    </div>
  );
}
