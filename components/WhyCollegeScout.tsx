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
    <section className="rounded-3xl bg-slate-50 px-6 py-14 sm:px-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          College decisions are bigger than rankings.
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DIMENSIONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl bg-white p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/5 text-navy-900">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-sm font-bold text-navy-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{body}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-sm text-slate-500">
        CollegeScout brings these signals together so you can make a more informed decision — not
        just a more prestigious one.
      </p>
    </section>
  );
}
