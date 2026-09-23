import { ExternalLink } from "lucide-react";
import type { CollegeSystem } from "@/lib/types";
import { getSystemRequirements, lineText, type SystemRequirements, type SystemSection } from "@/lib/systemRequirements";

function Section({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group mt-3 rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-navy-900">
        {title}
        <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
          &#9662;
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

function Courses({ info }: { info: SystemRequirements }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-slate-700">{info.courseRule.text}</p>
      <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {info.courses.map((c) => (
          <div key={c.area} className="flex gap-3 p-3 text-sm">
            <div className="w-5 shrink-0 font-bold uppercase text-slate-500">{c.area}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-navy-900">{c.subject}</span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {c.years} {c.years === 1 ? "year" : "years"}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SectionBody({ section, info }: { section: SystemSection; info: SystemRequirements }) {
  switch (section.kind) {
    case "lines":
      return (
        <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
          {section.lines.map((line) => (
            <li key={lineText(line)}>{lineText(line)}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <>
          <p className="text-sm leading-relaxed text-slate-700">{section.intro}</p>
          <ol className="mt-3 space-y-3">
            {section.steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold text-navy-900">{step.title}</div>
                  <ul className="mt-1 space-y-1 text-sm leading-relaxed text-slate-700">
                    {step.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          {section.labeled && (
            <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              {section.labeled.lines.map((line, i) => (
                <div key={line} className="px-3 py-2">
                  <dt className="text-xs font-semibold text-slate-500">{section.labeled?.labels[i]}</dt>
                  <dd className="mt-0.5 text-slate-700">{line}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      );
    case "bullets":
      return (
        <>
          <p className="text-sm leading-relaxed text-slate-700">{section.intro}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      );
    case "courses":
      return <Courses info={info} />;
  }
}

export default function SystemRequirementsCard({ system }: { system: CollegeSystem }) {
  const info = getSystemRequirements(system);
  if (!info) return null;

  return (
    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-bold text-navy-900">{info.title}</h4>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{info.appliesTo}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {info.tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-slate-50 p-3">
            <div className="text-2xl font-black tabular-nums text-navy-900">{tile.value}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">{tile.label}</div>
          </div>
        ))}
      </div>

      {info.sections.map((section) => (
        <Section key={section.title} title={section.title} open={section.open}>
          <SectionBody section={section} info={info} />
        </Section>
      ))}

      <h5 className="mt-5 text-xs font-bold tracking-wide text-slate-500">Official tools</h5>
      <ul className="mt-2 space-y-1.5 text-sm">
        {info.links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-gold-600 hover:text-gold-700"
            >
              {link.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[11px] leading-snug text-slate-500">
        Quoted from the system&apos;s own pages, read {info.checked}. {info.pageNote} These rules can change, so check
        the official pages before you plan your courses. Each campus, and each major, may add its own requirements.
      </p>
    </div>
  );
}
