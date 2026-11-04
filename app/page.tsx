import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

import HomeHero from "@/components/HomeHero";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import TryCollegeScout from "@/components/TryCollegeScout";
import HomeDueSoon from "@/components/HomeDueSoon";

/**
 * Four things, in the order a student uses them:
 *
 *   1 hero, with one action: pick what you're into     navy
 *   2 the interest picker it points to                 white <- try it
 *   3 same interest, different odds, different price   slate <- proof, on schools they just found
 *   4 upcoming deadlines                               white <- the next thing to do
 *
 * Then one line on where the facts come from. Why the site exists, the four ways it compares
 * colleges and the full sourcing story live on /about-data, for anyone who wants them; the
 * homepage only has to get a student moving.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <div className="mt-6 sm:mt-8">
        <TryCollegeScout />
      </div>
      <div className="mt-10 sm:mt-14">
        <CareerOutcomesStory />
      </div>
      <div className="mt-10 sm:mt-14">
        <HomeDueSoon />
      </div>
      <p className="mt-10 text-center text-sm text-slate-500 sm:mt-14">
        Every fact links to the page it came from.{" "}
        <Link href="/about-data" className="font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
          About CollegeScout
        </Link>
      </p>
    </div>
  );
}
