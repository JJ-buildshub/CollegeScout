import Link from "next/link";
import { ExternalLink, Music, Trophy } from "lucide-react";
import type { AthleticsWithSource, CollegeTalent, TalentFact } from "@/lib/collegeTalent";

function FactList({ facts }: { facts: TalentFact[] }) {
  return (
    <ul className="mt-3 space-y-3">
      {facts.map((fact) => (
        <li key={fact.text} className="text-sm leading-snug text-slate-600">
          {fact.text}
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {fact.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 hover:text-gold-700"
              >
                {source.label} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AthleticsBlock({ athletics }: { athletics: AthleticsWithSource }) {
  return (
    <div className="mt-3">
      <div className="text-base font-extrabold text-navy-900">
        {athletics.association}
        {athletics.division ? ` ${athletics.division}` : ""}
      </div>
      {athletics.sports && athletics.sports.length > 0 && (
        <>
          <div className="mt-3 text-xs font-bold tracking-wide text-slate-600">Varsity sports ({athletics.sports.length})</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {athletics.sports.map((sport) => (
              <span key={sport} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {sport}
              </span>
            ))}
          </div>
        </>
      )}
      <a
        href={athletics.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 hover:text-gold-700"
      >
        {athletics.source.label} <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}

function TalentCard({ icon: Icon, title, children }: { icon: typeof Music; title: string; children: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-600" />
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/** The Beyond Grades block on a college profile: what this college asks of musicians and athletes, each line linked to its source. */
export default function CollegeTalentSection({ talent }: { talent: CollegeTalent }) {
  const { music, sports, athletics } = talent;
  const hasMusic = music.length > 0;
  const hasSports = sports.length > 0 || athletics !== null;
  return (
    <>
      <div className={`mt-3 grid items-stretch gap-4 ${hasMusic && hasSports ? "lg:grid-cols-2" : ""}`}>
        {hasMusic && (
          <TalentCard icon={Music} title="Music">
            <FactList facts={music} />
          </TalentCard>
        )}
        {hasSports && (
          <TalentCard icon={Trophy} title="Sports">
            {athletics && <AthleticsBlock athletics={athletics} />}
            {sports.length > 0 && <FactList facts={sports} />}
          </TalentCard>
        )}
      </div>
      <Link href="/beyond-grades" className="mt-3 inline-block text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
        How music and sports fit into an application
      </Link>
    </>
  );
}
