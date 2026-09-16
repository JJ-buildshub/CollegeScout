"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ListPlus } from "lucide-react";
import { readSavedIds } from "@/lib/useSavedColleges";

export default function BuildYourList() {
  const [mounted, setMounted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    setSavedCount(readSavedIds().length);
    setMounted(true);
  }, []);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <ListPlus className="h-5 w-5 text-navy-900" />
      <h2 className="mt-3 text-lg font-bold text-navy-900">
        Build a list with a reason behind every school.
      </h2>
      <p className="mt-2 flex-1 text-sm text-slate-500">
        A strong list includes schools that serve different purposes: aspirational options,
        strong program matches, realistic targets, and more attainable choices you&apos;d
        genuinely be happy attending.
      </p>
      <p className="mt-3 text-xs font-semibold text-gold-600">
        {mounted
          ? savedCount > 0
            ? `${savedCount} school${savedCount === 1 ? "" : "s"} saved so far`
            : "Start saving colleges from the Directory or your Fit results."
          : "Save schools as you go"}
      </p>
      <Link
        href="/directory"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-navy-700"
      >
        Browse the Directory <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
