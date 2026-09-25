import { Banknote, GraduationCap, LineChart, School, Users2 } from "lucide-react";

const DIMENSIONS = [
  {
    icon: LineChart,
    title: "Admissions",
    body: "How competitive is the school — and your intended program?",
  },
  {
    icon: GraduationCap,
    title: "Academics",
    body: "Does it actually offer what you want to study?",
  },
  {
    icon: School,
    title: "Career Outcomes",
    body: "Where do graduates work, and what opportunities does the program create?",
  },
  {
    icon: Users2,
    title: "Campus Fit",
    body: "What does it feel like to spend four years there?",
  },
  {
    icon: Banknote,
    title: "Cost",
    body: "What might the school actually cost your family?",
  },
];

export default function WhyCollegeScout() {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-slate-100 px-6 py-14 sm:px-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        {/* Opens on what the reader gains, not on what rankings get wrong — the
            hero already makes the ranking point, and repeating it here framed
            the visitor as someone who'd been taken in. The one critical line
            lands at the end of the section instead, once the five are shown. */}
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">
          What actually makes a college right for you.
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Five questions worth asking about any school &mdash; and every profile answers them from
          the school&apos;s own published figures.
        </p>
      </div>

      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-4">
        {DIMENSIONS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/5 text-navy-900">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-sm font-bold text-navy-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
