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
    <section className="py-2">
      <div className="mx-auto max-w-2xl text-center">
        {/* Opens on what the reader gains, not on what rankings get wrong — the
            hero already makes the ranking point, and repeating it here framed
            the visitor as someone who'd been taken in. The one critical line
            lands at the end of the section instead, once the five are shown. */}
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">
          What actually makes a college right for you.
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Compare every college on the same five things.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {DIMENSIONS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="border-t-2 border-navy-900/10 pt-4"
          >
            <Icon className="h-4 w-4 text-gold-600" strokeWidth={2} />
            <h3 className="mt-3 text-sm font-bold text-navy-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-snug text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
