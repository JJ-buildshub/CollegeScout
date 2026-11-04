"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/** `exact` keeps a parent address from also lighting up for the pages under it. */
type TabPage = { href: string; label: string; exact?: boolean };

/** The pages under each top menu item. Every page keeps its own address, so old links still work. */
export const EXPLORE_PAGES: TabPage[] = [
  { href: "/directory", label: "All Colleges" },
  { href: "/beyond-grades", label: "Music Track", exact: true },
  { href: "/beyond-grades/sports-track", label: "Sports Track", exact: true },
];

export const PLAN_PAGES: TabPage[] = [
  { href: "/checklist", label: "My Plan" },
  { href: "/due-soon", label: "Deadlines" },
];

const isUnder = (pathname: string | null, href: string) => pathname === href || !!pathname?.startsWith(href + "/");

// The music and sports pathway pages (/beyond-grades/oboe and so on) sit under Explore too.
export const isExplorePath = (pathname: string | null) => isUnder(pathname, "/directory") || isUnder(pathname, "/beyond-grades");
export const isPlanPath = (pathname: string | null) => PLAN_PAGES.some(({ href }) => isUnder(pathname, href));

function SectionTabs({ label, pages }: { label: string; pages: TabPage[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] border-slate-200 px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-6 whitespace-nowrap">
        {pages.map(({ href, label: tab, exact }) => {
          const active = exact ? pathname === href : isUnder(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "-mb-px inline-block border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                  active ? "border-navy-900 text-navy-900" : "border-transparent text-slate-500 hover:text-navy-900"
                )}
              >
                {tab}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ExploreTabs() {
  return <SectionTabs label="Explore" pages={EXPLORE_PAGES} />;
}

export function PlanTabs() {
  return <SectionTabs label="My Plan" pages={PLAN_PAGES} />;
}
