import clsx from "clsx";
import type { CollegeSystem } from "@/lib/types";

// Four hues that stay distinguishable without competing with the page. The
// saturated Tailwind defaults (purple-500, amber-500) were louder than the
// admit rate they sat above, which is the number a visitor is actually here
// for. System type is a category, not a headline, so it reads quietly.
const SYSTEM_STYLES: Record<CollegeSystem, string> = {
  UC: "bg-[#eef1f7] text-[#3b567f] ring-1 ring-inset ring-[#d3dcea]",
  CSU: "bg-[#ecf2ef] text-[#38604d] ring-1 ring-inset ring-[#d0e0d8]",
  Private: "bg-[#f2eef5] text-[#5f4573] ring-1 ring-inset ring-[#e0d5e8]",
  Public: "bg-[#f5efe4] text-[#7a5c2c] ring-1 ring-inset ring-[#e7dac2]",
};

// Accent colors per system, shared by every card and profile header so a
// school type reads the same color everywhere on the site. `banner` is the
// muted solid profile-header background: dark enough for white text to stay
// readable (all four are at least 5:1), soft enough not to shout.
export const SYSTEM_ACCENT: Record<CollegeSystem, { edge: string; text: string; banner: string }> = {
  UC: { edge: "bg-[#5b7ba6]", text: "text-[#3b567f]", banner: "bg-[#3f5f8a]" },
  CSU: { edge: "bg-[#55806a]", text: "text-[#38604d]", banner: "bg-[#3f6b57]" },
  Private: { edge: "bg-[#7d6394]", text: "text-[#5f4573]", banner: "bg-[#6a4f80]" },
  Public: { edge: "bg-[#9c7a3c]", text: "text-[#7a5c2c]", banner: "bg-[#8a6a34]" },
};

export default function SystemBadge({ system, className }: { system: CollegeSystem; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight",
        SYSTEM_STYLES[system],
        className
      )}
    >
      {system}
    </span>
  );
}
