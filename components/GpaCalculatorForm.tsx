"use client";

import { ChevronDown, Info } from "lucide-react";
import {
  calculateCsuGpa,
  csuGpaStatus,
  validSatScore,
  type CsuGpaInputs,
  type GpaInputs,
  type UcGpaResult,
} from "@/lib/gpa";
import { getSystemRequirements } from "@/lib/systemRequirements";

interface Props {
  inputs: GpaInputs;
  onChange: (inputs: GpaInputs) => void;
  gpaResult: UcGpaResult;
  ucSectionOpen: boolean;
  onToggleUcSection: () => void;
  csuSectionOpen: boolean;
  onToggleCsuSection: () => void;
  homeState: string | null;
}

const EMPTY_CSU: CsuGpaInputs = { a: 0, b: 0, c: 0, d: 0, f: 0, honors10: 0, honors1112: 0 };

function CountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-center">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-gold-500"
      />
    </label>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">{label}</div>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
      />
    </label>
  );
}

/**
 * Plain-language explainer for "a-g", shown above the UC and CSU calculators.
 * The seven subject areas and years come from the UC's verified requirements
 * data (data/system-requirements.json), the same as the profile pages, so the
 * numbers can't drift from them. UC and CSU list the same pattern.
 */
function AgExplainer() {
  const courses = getSystemRequirements("UC")?.courses ?? [];
  if (courses.length === 0) return null;
  return (
    <details className="group mt-5 rounded-xl border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-navy-900">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          What&apos;s &quot;a-g&quot;? (You&apos;ll see it below.)
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-700">
        <p>
          &quot;a-g&quot; is a checklist of high school classes that California&apos;s public universities (UC and CSU)
          want to see. The letters a to g are labels for seven kinds of classes.
        </p>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {courses.map((c) => (
            <li key={c.area} className="flex items-baseline gap-3 px-3 py-2 text-sm">
              <span className="w-4 shrink-0 font-bold uppercase text-slate-400">{c.area}</span>
              <span className="flex-1 text-navy-900">{c.subject}</span>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {c.years} {c.years === 1 ? "year" : "years"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Your high school has a list of which of its classes count. Your <strong>a-g GPA</strong> is your GPA using
          only those classes, with an extra point for approved honors, AP and IB classes. UC and CSU use it for their
          minimum GPA requirements. Your report card GPA may count every class, so the two can differ.
        </p>
        <p className="mt-2">
          UC counts your 10th and 11th grade classes. CSU counts 10th, 11th and 12th, so the same grades can give
          different numbers.
        </p>
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          From the admission requirements pages of the UC and CSU, linked on each UC and CSU school&apos;s profile.
        </p>
      </div>
    </details>
  );
}

export default function GpaCalculatorForm({
  inputs,
  onChange,
  gpaResult,
  ucSectionOpen,
  onToggleUcSection,
  csuSectionOpen,
  onToggleCsuSection,
  homeState,
}: Props) {
  const csu = inputs.csu ?? EMPTY_CSU;
  const setCsu = (patch: Partial<CsuGpaInputs>) => onChange({ ...inputs, csu: { ...csu, ...patch } });
  const csuResult = calculateCsuGpa(csu);
  const csuStatus = csuResult.gpa === null ? null : csuGpaStatus(csuResult.gpa);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-bold text-navy-900">Your GPA and test score</h2>
      <p className="mt-1 text-xs text-slate-500">
        Your unweighted GPA is what most schools compare you against. An SAT score is optional.
      </p>

      <div className="mt-5">
        <NumberField
          label="Unweighted GPA"
          hint="On a standard 4.0 scale."
          value={inputs.unweightedGpa}
          min={0}
          max={4}
          step={0.01}
          onChange={(v) => onChange({ ...inputs, unweightedGpa: v })}
        />
      </div>

      <div className="mt-5">
        <label className="block">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            SAT score <span className="font-normal text-slate-400">(optional)</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Total from 400 to 1600. Leave blank if you haven&apos;t taken it or don&apos;t plan to send it. It&apos;s
            only used where a school publishes an SAT range and looks at scores.
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={inputs.satScore ?? ""}
            min={400}
            max={1600}
            step={10}
            placeholder="e.g. 1250"
            onChange={(e) =>
              onChange({
                ...inputs,
                satScore: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold-500"
          />
        </label>
        {inputs.satScore !== undefined && !validSatScore(inputs.satScore) && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            Enter a score from 400 to 1600. Until then it isn&apos;t used.
          </p>
        )}
      </div>

      <AgExplainer />

      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onToggleUcSection}
          aria-expanded={ucSectionOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-semibold text-navy-900">
            Applying to a UC? Calculate your UC GPA.
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${ucSectionOpen ? "rotate-180" : ""}`}
          />
        </button>

        {ucSectionOpen && (
          <div className="mt-4 space-y-5">
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Based on the official UC formula: only 10th and 11th grade count toward this GPA —
              9th and 12th grade aren&apos;t included — and honors/AP/IB bonus points are capped
              at 8 semesters (4 year-long courses) within that window.
            </p>
            <NumberField
              label="Total A-G semesters completed (10th & 11th grade)"
              hint="e.g. 5 classes/year x 2 years x 2 semesters = 20."
              value={inputs.totalSemesters}
              min={1}
              max={40}
              step={1}
              onChange={(v) => onChange({ ...inputs, totalSemesters: v })}
            />
            <NumberField
              label="Honors / AP / IB semesters completed (10th & 11th grade)"
              hint="Capped at 8 semesters for UC GPA purposes, even if you've taken more."
              value={inputs.honorsSemesters}
              min={0}
              max={40}
              step={1}
              onChange={(v) => onChange({ ...inputs, honorsSemesters: v })}
            />

            <div className="rounded-xl bg-navy-900 p-4 text-white">
              <div className="text-xs font-semibold tracking-wide text-slate-300">
                Your UC Capped Weighted GPA
              </div>
              <div className="mt-1 text-3xl font-extrabold text-gold-400">
                {gpaResult.ucCappedGpa.toFixed(2)}
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Honors/AP/IB semesters counted</span>
                  <span className="font-semibold text-white">
                    {gpaResult.cappedHonorsSemesters} / 8 max
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus points added</span>
                  <span className="font-semibold text-white">+{gpaResult.bonusPoints.toFixed(3)}</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-snug text-slate-400">
                Only UC schools are compared using your UC-capped GPA. CSU, private, and
                out-of-state schools are compared using your unweighted GPA, because that&apos;s
                the number they report.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onToggleCsuSection}
          aria-expanded={csuSectionOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-semibold text-navy-900">Applying to a CSU? Calculate your CSU GPA.</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${csuSectionOpen ? "rotate-180" : ""}`}
          />
        </button>

        {csuSectionOpen && (
          <div className="mt-4 space-y-5">
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The CSU counts every &quot;a-g&quot; grade after 9th grade, so 10th, 11th and 12th grade. Ignore pluses
              and minuses (a B+ is a B). Count each college-course semester twice, as CSU does (a B in a college class
              is two B&apos;s).
            </p>
            <div>
              <div className="text-sm font-semibold text-navy-900">How many of each grade?</div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                <CountField label="A" value={csu.a} onChange={(v) => setCsu({ a: v })} />
                <CountField label="B" value={csu.b} onChange={(v) => setCsu({ b: v })} />
                <CountField label="C" value={csu.c} onChange={(v) => setCsu({ c: v })} />
                <CountField label="D" value={csu.d} onChange={(v) => setCsu({ d: v })} />
                <CountField label="F" value={csu.f} onChange={(v) => setCsu({ f: v })} />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-navy-900">Honors, AP, IB and college semesters</div>
              <p className="mt-0.5 text-xs text-slate-400">
                Only semesters you finished with a C or better. Up to 8 count, and no more than 2 from 10th grade.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <CountField label="In 10th grade" value={csu.honors10} onChange={(v) => setCsu({ honors10: v })} />
                <CountField label="In 11th and 12th" value={csu.honors1112} onChange={(v) => setCsu({ honors1112: v })} />
              </div>
            </div>

            <div className="rounded-xl bg-navy-900 p-4 text-white">
              <div className="text-xs font-semibold tracking-wide text-slate-300">Your CSU a-g GPA</div>
              <div className="mt-1 text-3xl font-extrabold text-gold-400">
                {csuResult.gpa === null ? "\u2014" : csuResult.gpa.toFixed(2)}
              </div>
              {csuResult.gpa !== null && (
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Grades counted</span>
                    <span className="font-semibold text-white">{csuResult.gradeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grade points</span>
                    <span className="font-semibold text-white">{csuResult.gradePoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Honors points counted</span>
                    <span className="font-semibold text-white">{csuResult.honorsPoints} / 8 max</span>
                  </div>
                </div>
              )}
              {csuStatus && (
                <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs leading-snug text-slate-200">
                  {(homeState === "CA" || homeState === null) && <p>{csuStatus.residents}</p>}
                  {(homeState !== "CA" || homeState === null) && <p>{csuStatus.nonResidents}</p>}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-snug text-slate-400">
                Meeting a GPA level isn&apos;t the same as being admitted. Impacted campuses and majors set higher
                GPAs and use supplemental factors. This matches CSU&apos;s own GPA calculator; use it to double-check.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
