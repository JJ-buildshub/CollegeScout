"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, ListChecks, SlidersHorizontal, Sparkles } from "lucide-react";
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
        ? hasUsableGpa
          ? `${targetSaved} of ${targetTotal} Target schools added`
          : "Complete your profile to see fit"
        : "Admissions matcher",
      href: "/matcher",
    },
    {
      icon: ListChecks,
      title: "Plan",
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
