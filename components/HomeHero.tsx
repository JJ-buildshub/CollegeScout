import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomeHero() {
  return (
    <section className="overflow-hidden rounded-3xl bg-navy-900 px-6 py-8 text-white sm:px-12 sm:py-14">
      <div className="mx-auto max-w-2xl text-center xl:max-w-none">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-[56px]">
          Find colleges you didn&apos;t know to look for.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
          Tell us what you&apos;re interested in and what matters to you. We&apos;ll help you
          discover colleges, programs, and possibilities worth a closer look.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
          >
            Explore Colleges <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/matcher"
            className="inline-flex items-center gap-2 rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            My Fit
          </Link>
        </div>
      </div>
    </section>
  );
}
