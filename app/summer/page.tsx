"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ExternalLink, Sun } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import SaveSummerProgramButton from "@/components/SaveSummerProgramButton";
import {
  passionProjectIdeas,
  summerPrograms,
  type SummerCategory,
  type SummerCost,
  type SummerFormat,
  type SummerGrade,
  type SummerInterest,
  type SummerProgram,
} from "@/data/summerPrograms";
import {
  formatSummerDate,
  isBayArea,
  matchesGrade,
  matchesPlace,
  summerComparator,
  summerInterestLabel,
  summerInterests,
  type SummerPlace,
  type SummerSort,
} from "@/lib/summer";

const CHECK_SITE = "Check official site";

const TABS: { id: SummerCategory; label: string }[] = [
  { id: "work", label: "Work Experience" },
  { id: "university", label: "University Programs" },
  { id: "build", label: "Build Your Own" },
];

const COST_STYLE: Record<SummerCost, string> = {
  Free: "bg-gold-100 text-gold-700",
  Stipend: "bg-navy-900 text-gold-400",
  Paid: "bg-sand-100 text-navy-900",
};

/**
 * The server renders this page once at build time, so whether a deadline has passed cannot be in
 * that HTML. `today` stays null until the browser mounts.
 */
function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

function formatLabel(format: SummerFormat) {
  return format.kind === "online" ? "Online" : format.place;
}

function Row({ label, value, note }: { label: string; value: string | null; note?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-0.5 leading-snug text-navy-900">
        {value ?? <span className="text-slate-500">{CHECK_SITE}</span>}
        {note && <span className="mt-0.5 block text-xs text-slate-500">{note}</span>}
      </dd>
    </div>
  );
}

function ProgramCard({ program, today }: { program: SummerProgram; today: Date | null }) {
  const { eligibility, deadline } = program;
  const passed = today && deadline && new Date(`${deadline}T23:59:59`) < today;
  const deadlineText = deadline ? `${passed ? "Passed " : ""}${formatSummerDate(deadline)}` : null;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {program.cost ? (
          <span className={clsx("rounded-full px-2.5 py-1 text-xs font-bold", COST_STYLE[program.cost])}>
            {program.cost}
            {program.amount && ` · ${program.amount.text} (${program.amount.year})`}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Cost: {CHECK_SITE}</span>
        )}
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{program.selectivity}</span>
        {isBayArea(program) && <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Bay Area</span>}
      </div>

      <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-navy-900">{program.name}</h3>
      <p className="text-sm font-medium text-slate-500">{program.host}</p>
      {program.costNote && <p className="mt-2 text-xs leading-snug text-slate-500">{program.costNote}</p>}

      <dl className="mt-4 grid flex-1 content-start gap-3 text-sm sm:grid-cols-2">
        <Row label="Deadline" value={deadlineText} note={program.deadlineNote} />
        <Row label="Dates" value={program.dates} />
        <Row label="Grades" value={eligibility.gradesLabel} />
        <Row label="Format" value={program.format.map(formatLabel).join(" · ")} />
        <Row label="Minimum age" value={eligibility.minAge} />
        <Row label="Citizenship" value={eligibility.citizenship} />
        <Row label="Location requirement" value={eligibility.location} />
        <Row label="Interests" value={program.interests.map(summerInterestLabel).join(", ")} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <SaveSummerProgramButton id={program.id} name={program.name} />
        <a
          href={program.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600"
        >
          Official site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Checked {formatSummerDate(program.lastVerified)}</p>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-sm font-semibold text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-full border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-normal text-navy-900 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
      >
        <option value="all">All</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProjectGuide() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">Start your own project</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {passionProjectIdeas.map((idea) => (
          <div key={idea.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-base font-extrabold text-navy-900">{idea.title}</h3>
            <p className="mt-1 text-sm leading-snug text-slate-500">{idea.summary}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-snug text-slate-700">
              {idea.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SummerPage() {
  const today = useToday();
  const [tab, setTab] = useState<SummerCategory>("work");
  const [cost, setCost] = useState("all");
  const [interest, setInterest] = useState("all");
  const [grade, setGrade] = useState("all");
  const [place, setPlace] = useState("all");
  const [sort, setSort] = useState<SummerSort>("deadline-soonest");

  const shown = useMemo(
    () =>
      summerPrograms
        .filter((p) => p.category === tab)
        .filter((p) => cost === "all" || p.cost === cost)
        .filter((p) => interest === "all" || p.interests.includes(interest as SummerInterest))
        .filter((p) => grade === "all" || matchesGrade(p, Number(grade) as SummerGrade))
        .filter((p) => place === "all" || matchesPlace(p, place as SummerPlace))
        .sort(summerComparator(sort, today)),
    [tab, cost, interest, grade, place, sort, today]
  );

  const clearFilters = () => {
    setCost("all");
    setInterest("all");
    setGrade("all");
    setPlace("all");
  };
  const filtered = cost !== "all" || interest !== "all" || grade !== "all" || place !== "all";

  return (
    <div className="space-y-6">
      <SectionHeader icon={Sun} label="Summer 2027" title="Make Your Summer Count">
        <p>Internships, college programs and project ideas for high school students, with what each one costs and when to apply.</p>
      </SectionHeader>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kinds of summer opportunities">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={clsx(
              "rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
              tab === id ? "bg-navy-900 text-gold-400" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-navy-900"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FilterSelect label="Cost" value={cost} onChange={setCost} options={[["Free", "Free"], ["Stipend", "Stipend"], ["Paid", "Paid"]]} />
        <FilterSelect label="Interest" value={interest} onChange={setInterest} options={summerInterests.map((id) => [id, summerInterestLabel(id)])} />
        <FilterSelect label="Your grade now" value={grade} onChange={setGrade} options={[["9", "9th"], ["10", "10th"], ["11", "11th"], ["12", "12th"]]} />
        <FilterSelect label="Format" value={place} onChange={setPlace} options={[["bay-area", "Bay Area"], ["online", "Online"], ["travel", "Travel"]]} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-slate-600" aria-live="polite">
            {shown.length} {shown.length === 1 ? "program" : "programs"}
          </p>
          {filtered && (
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-navy-900">
              Clear filters
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SummerSort)}
            className="rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm text-navy-900 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="deadline-soonest">Soonest deadline</option>
            <option value="deadline-latest">Latest deadline</option>
            <option value="start-soonest">Earliest start date</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
          Nothing here matches those filters.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((program) => (
            <ProgramCard key={program.id} program={program} today={today} />
          ))}
        </div>
      )}

      {tab === "build" && <ProjectGuide />}
    </div>
  );
}
