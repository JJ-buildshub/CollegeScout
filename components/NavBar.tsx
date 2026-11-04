"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Award, Briefcase, Compass, GraduationCap, LayoutList, Menu, ScanSearch, X } from "lucide-react";
import { isExplorePath, isPlanPath } from "@/components/SectionTabs";
import clsx from "clsx";
import { getCollegeById } from "@/lib/colleges";
import { useProfile } from "@/lib/profile";
import { entriesWithStatusAtLeast, listEntries, useCollegeList } from "@/lib/collegeList";
import { buildApplicationTasks, buildPathwayCategories, buildPlanCategories, buildSummerCategories, countOpenTasks, useCustomTasks, usePathwayPlan, useSummerPlan, useTaskProgress, type ApplicationTaskGroup } from "@/lib/tasks";

/** "My Fit · N schools" / "My Plan · N tasks" — live because every hook here is one of the shared stores. */
function useNavCounts() {
  const { profile } = useProfile();
  const { state } = useCollegeList();
  const { done } = useTaskProgress();
  useCustomTasks(); // subscribe so a custom add/remove updates the My Plan count too
  const { slugs: pathwaySlugs } = usePathwayPlan();

  const fitCount = listEntries(state).length;

  // Pathway and summer tasks don't depend on a grade, so they count even before one is set.
  const pathwayCategories = buildPathwayCategories(pathwaySlugs);
  const { ids: summerIds } = useSummerPlan();
  let planCount = countOpenTasks([...pathwayCategories, ...buildSummerCategories(summerIds)], [], done);
  if (profile.grade) {
    const interestIds = profile.undecided ? [] : profile.interests.map((i) => i.fieldId);
    const planCategories = buildPlanCategories(profile.grade, interestIds);
    const groups = entriesWithStatusAtLeast(state, "Applying")
      .map((entry) => {
        const college = getCollegeById(entry.collegeId);
        return college ? buildApplicationTasks(college, entry) : null;
      })
      .filter((g): g is ApplicationTaskGroup => g !== null);
    planCount += countOpenTasks(planCategories, groups, done);
  }

  return { fitCount, planCount };
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { fitCount, planCount } = useNavCounts();

  const counter = (n: number, unit: string) => (n > 0 ? `${n} ${unit}${n === 1 ? "" : "s"}` : null);
  const NAV_LINKS = [
    { href: "/directory", label: "Explore", icon: ScanSearch, counter: null as string | null, active: isExplorePath },
    { href: "/scholarships", label: "Scholarships", icon: Award, counter: null as string | null, active: (p: string | null) => p === "/scholarships" },
    { href: "/summer", label: "Internships & Programs", icon: Briefcase, counter: null as string | null, active: (p: string | null) => p === "/summer" },
    { href: "/matcher", label: "My Fit", icon: GraduationCap, counter: counter(fitCount, "school"), active: (p: string | null) => p === "/matcher" },
    { href: "/checklist", label: "My Plan", icon: LayoutList, counter: counter(planCount, "task"), active: isPlanPath },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center text-navy-900">
            <Compass className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold tracking-tight text-navy-900">
            College<span className="text-gold-600">Scout</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon, counter, active: isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors xl:px-4",
                  active
                    ? "bg-navy-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {counter && (
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      active ? "bg-gold-400 text-navy-950" : "bg-navy-900 text-gold-400"
                    )}
                  >
                    {counter}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-900 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 pb-3 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, counter, active: isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {counter && (
                    <span className={clsx("text-xs font-semibold", active ? "text-gold-400" : "text-slate-500")}>
                      &middot; {counter}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
