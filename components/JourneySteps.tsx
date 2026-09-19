"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, ListChecks, SlidersHorizontal, Sparkles } from "lucide-react";
import { colleges } from "@/lib/colleges";
import { calculateUcCappedGpa, evaluateCollegeFit, type GpaInputs } from "@/lib/gpa";
import { checklistData } from "@/lib/checklistData";
import { readSavedIds } from "@/lib/useSavedColleges";

export default function JourneySteps({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [hasGpaInputs, setHasGpaInputs] = useState(false);
  const [targetTotal, setTargetTotal] = useState(0);
  const [targetSaved, setTargetSaved] = useState(0);
  const [checklistDone, setChecklistDone] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(0);

  useEffect(() => {
    const savedIds = readSavedIds();
    setSavedCount(savedIds.length);

    try {
      const rawGpa = localStorage.getItem("pathfinder-admit:gpa-inputs");
      if (rawGpa) {
        const inputs = JSON.parse(rawGpa) as GpaInputs;
        setHasGpaInputs(true);
        const gpaResult = calculateUcCappedGpa(inputs);

        // Same precedence as app/matcher/page.tsx: a manually-set residency
        // override wins, otherwise home state derives in-state/out-of-state
        // per school, otherwise every school falls back to its overall rate.
        // Keeping this in sync so the homepage teaser count never disagrees
        // with the Matcher's own count once a state is set.
        const savedResidency = localStorage.getItem("pathfinder-admit:residency");
        const residency =
          savedResidency === "in-state" || savedResidency === "out-of-state" ? savedResidency : undefined;
        const homeState = localStorage.getItem("pathfinder-admit:home-state");

        let total = 0;
        let saved = 0;
        for (const college of colleges) {
          const fit = evaluateCollegeFit(college, gpaResult.ucCappedGpa, inputs.unweightedGpa, residency, homeState);
          if (fit?.category === "Target") {
            total += 1;
            if (savedIds.includes(college.id)) saved += 1;
          }
        }
        setTargetTotal(total);
        setTargetSaved(saved);
      }
    } catch {
      // ignore malformed/unavailable storage
    }

    try {
      const rawChecklist = localStorage.getItem("pathfinder-admit:checklist-progress");
      const progress = rawChecklist ? JSON.parse(rawChecklist) : {};
      const allIds = ([9, 10, 11, 12] as const).flatMap((g) =>
        checklistData[g].flatMap((c) => c.items.map((i) => i.id))
      );
      setChecklistTotal(allIds.length);
      setChecklistDone(allIds.filter((id) => progress[id]).length);
    } catch {
      // ignore malformed/unavailable storage
    }

    setMounted(true);
  }, []);

  const steps = [
    {
      icon: Compass,
      title: "Discover",
      hook: "Find schools beyond the obvious.",
      body: "Explore colleges and programs based on what you care about.",
      detail: mounted ? `${savedCount} school${savedCount === 1 ? "" : "s"} saved` : "Directory filters",
      href: "/directory",
    },
    {
      icon: Sparkles,
      title: "Understand",
      hook: "See what actually matters.",
      body: "Compare admissions, academics, career outcomes, cost, and campus life.",
      detail: "Full college profiles",
      href: "/directory",
    },
    {
      icon: SlidersHorizontal,
      title: "Match",
      hook: "Find your fit.",
      body: "Understand how schools align with your academic profile, interests, and priorities.",
      detail: mounted
        ? hasGpaInputs
          ? `${targetSaved} of ${targetTotal} Target schools added`
          : "Calculate your GPA to see fit"
        : "Admissions matcher",
      href: "/matcher",
    },
    {
      icon: ListChecks,
      title: "Plan",
      hook: "Know what comes next.",
      body: "Build your list and stay ahead of applications, deadlines, and milestones.",
      detail: mounted ? `${checklistDone} of ${checklistTotal} milestones complete` : "Runway milestones",
      href: "/checklist",
    },
  ];

  if (compact) {
    return (
      <section className="py-2">
        <h2 className="text-xs font-bold tracking-wide text-slate-400">How CollegeScout Works</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Link
              key={step.title}
              href={step.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-gold-400">
                {i + 1}
              </span>
              <step.icon className="h-4 w-4 shrink-0 text-navy-900" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-navy-900">{step.hook}</div>
                <div className="truncate text-xs font-semibold text-gold-600">{step.detail}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Link
            key={step.title}
            href={step.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-gold-400">
                {i + 1}
              </span>
              {step.title}
            </div>
            <div className="mt-3 flex items-center gap-2 text-base font-bold text-navy-900">
              <step.icon className="h-4 w-4 text-navy-900" /> {step.hook}
            </div>
            <p className="mt-1.5 flex-1 text-sm text-slate-500">{step.body}</p>
            <p className="mt-3 text-xs font-semibold text-gold-600">{step.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
