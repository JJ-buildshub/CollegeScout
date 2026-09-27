"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, ListChecks, SlidersHorizontal } from "lucide-react";
import { colleges, getCollegeById } from "@/lib/colleges";
import { evaluateCollegeFit } from "@/lib/gpa";
import { computeGpaSummary, useProfile } from "@/lib/profile";
import { entriesWithStatusAtLeast, listEntries, useCollegeList } from "@/lib/collegeList";
import { buildApplicationTasks, buildPlanCategories, countOpenTasks, useCustomTasks, useTaskProgress, type ApplicationTaskGroup } from "@/lib/tasks";

export default function JourneySteps({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { profile } = useProfile();
  const { state: collegeListState } = useCollegeList();
  const { done } = useTaskProgress();
  useCustomTasks();

  useEffect(() => setMounted(true), []);

  const savedCount = listEntries(collegeListState).length;
  const gpaSummary = computeGpaSummary(profile);
  const hasUsableGpa = gpaSummary.cumulativeUnweighted !== null;

  let targetTotal = 0;
  let targetSaved = 0;
  if (hasUsableGpa) {
    // Same as My Fit: a "compare as another state" scenario wins over the saved home
    // state when set, and UC schools ignore unweightedGpa/satScore entirely — only
    // ucCappedGpaSelfReported (or null, for a Limited-data estimate) affects a UC result.
    const unweightedGpa = gpaSummary.cumulativeUnweighted as number;
    const effectiveHomeState = profile.residencyScenario ?? profile.homeState;
    for (const college of colleges) {
      const fit = evaluateCollegeFit(
        college,
        profile.ucCappedGpaSelfReported,
        unweightedGpa,
        undefined,
        effectiveHomeState,
        profile.satScore ?? undefined
      );
      if (fit?.category === "Target") {
        targetTotal += 1;
        if (collegeListState.entries[college.id]) targetSaved += 1;
      }
    }
  }

  let planCount = 0;
  if (profile.grade) {
    const interestIds = profile.undecided ? [] : profile.interests.map((i) => i.fieldId);
    const planCategories = buildPlanCategories(profile.grade, interestIds);
    const groups = entriesWithStatusAtLeast(collegeListState, "Applying")
      .map((entry) => {
        const college = getCollegeById(entry.collegeId);
        return college ? buildApplicationTasks(college, entry) : null;
      })
      .filter((g): g is ApplicationTaskGroup => g !== null);
    planCount = countOpenTasks(planCategories, groups, done);
  }

  const steps = [
    // Discover and Understand used to be two cards that both linked to
    // /directory, which made the journey look like four destinations when the
    // site has three. They're one step: browsing and reading a profile are the
    // same place.
    {
      icon: Compass,
      title: "Explore",
      hook: "Find schools beyond the obvious.",
      body: "Search by what you want to study, then compare admissions, cost and campus life on any profile.",
      detail: mounted ? `${savedCount} school${savedCount === 1 ? "" : "s"} saved` : "Directory filters",
      href: "/directory",
    },
    {
      icon: SlidersHorizontal,
      title: "My Fit",
      hook: "See which schools fit you.",
      body: "Understand how schools align with your academic profile, interests, and priorities.",
      detail: mounted
        ? hasUsableGpa
          ? `${targetSaved} of ${targetTotal} Target schools added`
          : "Complete your profile to see fit"
        : "Admissions matcher",
      href: "/matcher",
    },
    {
      icon: ListChecks,
      title: "My Plan",
      hook: "Know what comes next.",
      body: "Build your list and stay ahead of applications, deadlines, and milestones.",
      detail: mounted ? `${planCount} task${planCount === 1 ? "" : "s"} remaining` : "Runway milestones",
      href: "/checklist",
    },
  ];

  if (compact) {
    return (
      <section className="py-2">
        <h2 className="text-xs font-bold tracking-wide text-slate-500">How CollegeScout Works</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
    <section id="how-it-works" className="scroll-mt-24 py-2">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Start anywhere.
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          Three places to work, in whatever order suits you.
        </p>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Link
            key={step.title}
            href={step.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-600">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-gold-400">
                {i + 1}
              </span>
              {step.title}
            </div>
            <div className="mt-3 flex items-center gap-2 text-base font-bold text-navy-900">
              <step.icon className="h-3.5 w-3.5 shrink-0 text-navy-900" /> {step.hook}
            </div>
            <p className="mt-1.5 flex-1 text-sm text-slate-500">{step.body}</p>
            <p className="mt-3 text-xs font-semibold text-gold-600">{step.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
