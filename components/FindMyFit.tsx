import Link from "next/link";
import { ArrowRight } from "lucide-react";

const INPUTS = ["GPA", "Honors/AP/IB course rigor", "SAT/ACT (optional)"];

export default function FindMyFit() {
  return (
    <section className="rounded-3xl border border-sand-200 bg-sand-100 p-5 sm:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[28px]">
          Which of these schools make sense for you?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Add your GPA, course rigour and test scores, and every school gets sorted into Reach,
          Target and Likely &mdash; for you specifically.
        </p>
      </div>

      <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-2">
        {INPUTS.map((input) => (
          <span
            key={input}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {input}
          </span>
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-md text-center text-xs text-slate-500">
        Your inputs stay on this device &mdash; nothing is uploaded, and no account is required.
        CollegeScout never promises admissions probabilities.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/matcher"
          className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Go to My Fit <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
