import { ExternalLink } from "lucide-react";
import type { College } from "@/lib/types";
import { CURRENT_ESSAY_CYCLE, getApplicationInfo, type WritingItem } from "@/lib/applications";
import SystemRequirementsCard from "./SystemRequirementsCard";
import { COMMON_APP_SOURCE, getCommonAppFacts, type CommonAppFacts } from "@/lib/commonapp";

function WritingCard({ item }: { item: WritingItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-navy-900">{item.title}</h4>
        {item.limit && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {item.limit}
          </span>
        )}
      </div>
      {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
      {item.prompts.length > 0 && (
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-700">
          {item.prompts.map((prompt, i) => (
            <li key={prompt} className="flex gap-3">
              <span className="w-4 shrink-0 text-right text-xs font-bold tabular-nums text-slate-500">{i + 1}</span>
              <span>&ldquo;{prompt}&rdquo;</span>
            </li>
          ))}
        </ol>
      )}
      {item.link && (
        <a
          href={item.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
        >
          {item.link.label} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function Group({ label, items }: { label: string; items: WritingItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <div className="text-xs font-bold tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 space-y-3">
        {items.map((item) => (
          <WritingCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function factRows(f: CommonAppFacts): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const fee = f.feeUS ?? f.feeIntl;
  if (fee) rows.push({ label: "Application fee", value: f.feeUS && f.feeIntl && f.feeUS !== f.feeIntl ? `${f.feeUS} U.S., ${f.feeIntl} international` : fee });
  if (f.feeWaiver) {
    rows.push({
      label: "Common App fee waiver",
      value: f.feeWaiver === "Accepted" ? "Accepted" : f.feeWaiver === "U.S. only" ? "Accepted for U.S. students only" : "Not accepted",
    });
  }
  if (f.personalEssayRequired) rows.push({ label: "Common App personal essay", value: "Required" });
  if (f.coursesGradesRequired) rows.push({ label: "Self-reported courses and grades", value: "Required" });
  if (f.portfolio) rows.push({ label: "Portfolios collected through", value: f.portfolio });
  const recs: string[] = [];
  if (f.teacherEvaluations) recs.push(plural(f.teacherEvaluations, "teacher recommendation"));
  if (f.otherEvaluations) recs.push(plural(f.otherEvaluations, "other recommendation"));
  if (f.counselorRecommendation) recs.push("counselor recommendation");
  if (f.midYearReport) recs.push("mid-year report");
  if (recs.length > 0) rows.push({ label: "Recommendations", value: recs.join(", ") });
  return rows;
}

function CommonAppCard({ facts }: { facts: CommonAppFacts }) {
  const rows = factRows(facts);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-bold text-navy-900">Applying through the Common App</h4>
      </div>
      {rows.length > 0 && (
        <dl className="mt-3 divide-y divide-slate-100 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="text-right font-semibold text-navy-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-[11px] leading-snug text-slate-500">
        Source:{" "}
        <a href={COMMON_APP_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          Common App requirements grid
        </a>
        , updated {COMMON_APP_SOURCE.updated}. Anything not listed here wasn&apos;t stated in the grid, which is not the
        same as not required.
      </p>
    </div>
  );
}

export default function ApplicationRequirements({ college }: { college: College }) {
  const info = getApplicationInfo(college.id);
  const verified = info?.verifiedForCycle === CURRENT_ESSAY_CYCLE ? info : null;
  const facts = getCommonAppFacts(college.id);
  const systemCard =
    college.system === "CSU" || college.system === "UC" ? <SystemRequirementsCard system={college.system} /> : null;

  // No verified-for-this-cycle essay record — whether there's no record at all, or one left
  // over from an older cycle. Never show a guessed prompt or an empty card here; the rest of
  // the Applying tab (system rules, Common App facts) still renders normally above this box.
  if (!verified) {
    return (
      <div className="max-w-3xl space-y-3">
        {systemCard}
        {facts && <CommonAppCard facts={facts} />}
        <div className="max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-6">
          <div className="text-sm font-bold text-navy-900">Essay details are being verified</div>
          <p className="mt-2 text-sm text-slate-500">
            College-specific prompts can change each application cycle. Check the school&apos;s official application
            page for the latest requirements.
          </p>
          {college.website && (
            <a
              href={college.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
            >
              View official application requirements <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-navy-900">Essays and application</div>
          <span className="rounded-full bg-navy-900/5 px-2 py-0.5 text-[11px] font-semibold text-navy-900">
            {verified.verifiedForCycle}
          </span>
        </div>
        {verified.platforms.length > 0 && (
          <div className="text-xs text-slate-500">
            Applies through <span className="font-semibold text-navy-900">{verified.platforms.join(" or ")}</span>
          </div>
        )}
      </div>

      {systemCard && <div className="mt-5">{systemCard}</div>}
      {facts && (
        <div className="mt-5">
          <CommonAppCard facts={facts} />
        </div>
      )}

      <Group label="Main essay" items={[verified.mainEssay]} />
      <Group label="Required school-specific writing" items={verified.requiredWriting} />
      <Group label="Optional school-specific writing" items={verified.optionalWriting} />

      {verified.extras.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {verified.extras.map((extra) => (
            <li key={extra}>{extra}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs leading-relaxed text-slate-600">
          Prompts are quoted from the school&apos;s own page, read {verified.source.checked}
          {verified.source.cycle ? ` (${verified.source.cycle} cycle)` : ""}. Schools change their prompts and word
          limits every year, so check the school&apos;s site for the current list before you start writing.
        </p>
        <a
          href={verified.essayPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 hover:text-gold-700"
        >
          Check the current prompts on the school&apos;s site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
