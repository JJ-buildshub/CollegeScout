import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  GraduationCap,
  MapPin,
  Sparkles,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { colleges, getCollegeById, formatPercent, admitRateTier } from "@/lib/colleges";
import SystemBadge from "@/components/SystemBadge";
import SaveToggleButton from "@/components/SaveToggleButton";
import TestingPolicyBadge from "@/components/TestingPolicyBadge";
import ApplicationPlanBadges from "@/components/ApplicationPlanBadges";
import FinancialSnapshot from "@/components/FinancialSnapshot";
import CampusFitStats from "@/components/CampusFitStats";

export function generateStaticParams() {
  return colleges.map((c) => ({ id: c.id }));
}

export default function CollegeDetailPage({ params }: { params: { id: string } }) {
  const college = getCollegeById(params.id);
  if (!college) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Directory
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SystemBadge system={college.system} />
              <SaveToggleButton collegeId={college.id} />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              {college.name}
            </h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {college.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              National Rank
            </div>
            <div className="text-3xl font-extrabold text-navy-900">#{college.rank}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
          <Stat label="Overall Admit Rate" value={formatPercent(college.admitRateOverall)} sub={admitRateTier(college.admitRateOverall)} />
          <Stat label="In-State Admit Rate" value={formatPercent(college.inStateAdmitRate)} />
          <Stat label="Out-of-State Admit Rate" value={formatPercent(college.outOfStateAdmitRate)} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Testing Policy</div>
            <div className="mt-1">
              <TestingPolicyBadge policy={college.testingPolicy} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <GpaBox label="Mid-50% Unweighted GPA" value={college.mid50_GPA_Unweighted} />
          <GpaBox label="Mid-50% UC-Capped GPA" value={college.mid50_GPA_UCCapped} />
          <GpaBox label="Mid-50% SAT" value={college.mid50_SAT} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={Sparkles} title="Campus Culture & Vibe">
          <p className="text-sm leading-relaxed text-slate-600">{college.campusCultureAndVibe}</p>
        </Section>

        <Section icon={GraduationCap} title="Ideal Student Archetype">
          <p className="text-sm leading-relaxed text-slate-600">
            {college.idealStudentArchetype.profileSummary}
          </p>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
              High School Course Prereqs
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {college.idealStudentArchetype.highSchoolCoursePrereqs.map((c) => (
                <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
              High-Impact "Spikes"
            </div>
            <ul className="mt-2 space-y-1.5">
              {college.idealStudentArchetype.highImpactSpikes.map((s) => (
                <li key={s} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section icon={Award} title="Flagship Programs">
          <div className="space-y-4">
            {college.flagshipPrograms.map((p) => (
              <div key={p.name} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-navy-900">{p.name}</div>
                  <span className="whitespace-nowrap rounded-full bg-navy-900 px-2 py-0.5 text-xs font-semibold text-white">
                    {p.ranking}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{p.selectivityNote}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Briefcase} title="Career Outcomes">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Placement Rate" value={college.careerOutcomes.placementRate} />
            <Stat label="Median Starting Salary" value={college.careerOutcomes.medianStartingSalary} />
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Top Recruiters</div>
            {college.careerOutcomes.topRecruiters.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {college.careerOutcomes.topRecruiters.map((r) => (
                  <span key={r} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {r}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Not publicly reported.</p>
            )}
          </div>
        </Section>

        <Section icon={Users} title="Impacted Majors">
          {college.impactedMajors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {college.impactedMajors.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No internally-impacted majors reported.</p>
          )}
        </Section>

        <Section icon={CalendarClock} title="Application Deadlines">
          <ApplicationPlanBadges plans={college.applicationPlans} />
        </Section>

        <Section icon={Wallet} title="Financial Snapshot">
          <FinancialSnapshot financials={college.financials} />
        </Section>

        <Section icon={Building2} title="Campus Fit">
          <CampusFitStats fit={college.campusFit} />
        </Section>

        <Section icon={Tags} title="Career & Major Pathways" className="lg:col-span-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Primary Disciplines</div>
            {college.careerMajorTags.primaryDisciplines.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {college.careerMajorTags.primaryDisciplines.map((d) => (
                  <span key={d} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Not publicly reported.</p>
            )}
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Interdisciplinary Pathways
            </div>
            {college.careerMajorTags.interdisciplinaryPathways.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {college.careerMajorTags.interdisciplinaryPathways.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-600 ring-1 ring-inset ring-gold-500/20"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">None documented yet.</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-navy-900">{value ?? "Not publicly reported"}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function GpaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-base font-bold text-navy-900">{value}</div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-card ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-600" />
        <h2 className="text-base font-bold text-navy-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
