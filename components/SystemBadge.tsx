import clsx from "clsx";
import type { CollegeSystem } from "@/lib/types";

const SYSTEM_STYLES: Record<CollegeSystem, string> = {
  UC: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  CSU: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Private: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  Public: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

// Accent colors per system, shared by every card and profile header so a
// school type reads the same color everywhere on the site. `banner` is the
// muted solid profile-header background: dark enough for white text to stay
// readable (all four are at least 5:1), soft enough not to shout.
export const SYSTEM_ACCENT: Record<CollegeSystem, { edge: string; text: string; banner: string }> = {
  UC: { edge: "bg-blue-500", text: "text-blue-700", banner: "bg-[#3f5f8a]" },
  CSU: { edge: "bg-emerald-500", text: "text-emerald-700", banner: "bg-[#3f6b57]" },
  Private: { edge: "bg-purple-500", text: "text-purple-700", banner: "bg-[#6a4f80]" },
  Public: { edge: "bg-amber-500", text: "text-amber-700", banner: "bg-[#8a6a34]" },
};

export default function SystemBadge({ system, className }: { system: CollegeSystem; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        SYSTEM_STYLES[system],
        className
      )}
    >
      {system}
    </span>
  );
}
