import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { admitRateTier, displayedAdmitRate, formatPercent, getCollegeById } from "@/lib/colleges";
import type { College } from "@/lib/types";

/**
 * A worked example shown BEFORE the visitor picks anything, so they can see what
 * CollegeScout answers before being asked for input.
 *
 * Two real schools in the same field with very different admit rates. The label
 * on each card describes the school's own admit rate — not the visitor's odds,
 * which this page can't know yet and which My Fit (Reach/Target/Likely) is the
 * place for. The pair is fixed because only 35 of 336 schools publish all three
 * outcome figures; these two do, teach in the same field, and sit at opposite
 * ends of the selectivity range.
 */
const EXAMPLE_INTEREST = "computer science";
const EXAMPLE_IDS = ["stanford-university", "san-jose-state-university"];

/**
 * Matches the example interest against a school's own flagshipPrograms, so each
 * card can show why THIS school is a real answer for it rather than just
 * asserting that it teaches the subject. Both schools here name a computer
 * science program among their flagships, with their own published ranking.
 */
const FLAGSHIP_PATTERN = /computer science|software/i;

function flagshipFor(college: College) {
  return college.flagshipPrograms?.find((p) => FLAGSHIP_PATTERN.test(p.name)) ?? null;
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString()}`;
}

/**
 * On a phone the two cards stack, putting 491px between the two admit-rate bars
 * — far enough apart that the comparison this section exists to make can't
 * actually be made. This puts the two contrasting figures side by side above
 * them on narrow screens; the full cards still follow for the detail.
 */
function CompareAtAGlance({ examples }: { examples: College[] }) {
  return (
    <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:hidden">
      {examples.map((college) => {
        const rate = displayedAdmitRate(college).value;
        const cost = college.financials.coaInState;
        return (
          <div key={college.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold leading-tight text-navy-900">{college.name}</div>
            <div className="mt-3 text-3xl font-extrabold leading-none text-navy-900">
              {formatPercent(rate)}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${rate >= 0.5 ? "bg-gold-500" : "bg-navy-900"}`}
                style={{ width: `${Math.max(rate * 100, 2)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-slate-500">admitted</div>
            {cost !== null && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="text-base font-extrabold leading-none text-navy-900">
                  {formatUsd(cost)}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">a year, before aid</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExampleCard({ college }: { college: College }) {
  const rate = displayedAdmitRate(college).value;
  const tier = admitRateTier(rate);
  const outcomes = college.careerOutcomes;
  const flagship = flagshipFor(college);
  // Published cost of attendance, before aid — deliberately not an average net
  // price. A net-price average is taken across every aided student, so quoting
  // one figure implies a precision no individual family has; what aid does to
  // this number is a separate question, answered per school on its profile.
  const { coaInState, coaOutOfState } = college.financials;
  const costSub =
    coaOutOfState !== null && coaOutOfState !== coaInState
      ? `in-state, before aid · ${formatUsd(coaOutOfState)} out-of-state`
      : "per year, before aid";

  return (
    <Link
      href={`/directory/${college.id}`}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <h3 className="text-lg font-bold leading-snug text-navy-900">{college.name}</h3>

      {/* The admit rate as a proportion, not a label. 4% against 85% is the
          whole point of this section, and two identical grey pills threw that
          away. Gold fills the open school, navy the selective one — the first
          time either colour is a surface rather than small text. */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold tracking-wide text-slate-600">{tier}</span>
          <span className="text-2xl font-extrabold leading-none text-navy-900">
            {formatPercent(rate)}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${rate >= 0.5 ? "bg-gold-500" : "bg-navy-900"}`}
            style={{ width: `${Math.max(rate * 100, 2)}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500">of applicants are admitted</div>
      </div>

      {flagship && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-semibold text-navy-900">{flagship.name}</span>
          {flagship.ranking ? ` — ${flagship.ranking}` : ""}
        </p>
      )}

      {/* Cost sits under selectivity and above outcomes: how hard is it to get
          in, what will it actually cost, then where does it lead. */}
      {coaInState !== null && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold tracking-wide text-slate-500">
            Cost of attendance
          </div>
          <div className="text-xl font-extrabold leading-tight text-navy-900">
            {formatUsd(coaInState)}
          </div>
          <div className="text-[11px] text-slate-500">{costSub}</div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">Placement Rate</div>
          <div className="mt-0.5 text-base font-bold text-navy-900">
            {outcomes.placementRate ?? "Not confirmed yet"}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">
            Median Starting Salary
          </div>
          <div className="mt-0.5 text-base font-bold text-navy-900">
            {outcomes.medianStartingSalary ?? "Not confirmed yet"}
          </div>
        </div>
      </div>

      {outcomes.topRecruiters.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold tracking-wide text-slate-500">Top Recruiters</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {outcomes.topRecruiters.slice(0, 4).map((r) => (
              <span
                key={r}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600">
        View full profile <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default function CareerOutcomesStory() {
  const examples = EXAMPLE_IDS.map(getCollegeById).filter((c): c is College => Boolean(c));
  if (examples.length < 2) return null;

  // Named from the data rather than written into the copy, so the closing line
  // can't outlive the recruiter lists it describes. The two schools' salaries
  // differ a lot, so the point here is the overlap in who hires them — never
  // that the outcomes are equivalent.
  const sharedRecruiters = examples[0].careerOutcomes.topRecruiters.filter((r) =>
    examples.every((c) => c.careerOutcomes.topRecruiters.includes(r))
  );

  return (
    <section id="career-outcomes" className="rounded-3xl border border-slate-200/70 bg-slate-100 px-6 py-10 sm:px-12 sm:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">
          Two schools, one subject.
        </h2>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Both are known for {EXAMPLE_INTEREST}. One admits 4 in 100. The other admits most who
          apply.
        </p>
      </div>

      <CompareAtAGlance examples={examples} />

      <div className="mx-auto mt-6 grid max-w-4xl gap-6 sm:mt-8 sm:grid-cols-2">
        {examples.map((college) => (
          <ExampleCard key={college.id} college={college} />
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-slate-500">
        Figures are university-wide, as reported by each school.{" "}
        {sharedRecruiters.length > 0 && (
          <>
            Both send graduates to{" "}
            <span className="font-semibold text-navy-900">
              {sharedRecruiters.slice(0, 3).join(", ")}
            </span>
            .{" "}
          </>
        )}
        The second school is the one most students never hear about.
      </p>
    </section>
  );
}
