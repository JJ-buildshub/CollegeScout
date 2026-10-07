import clsx from "clsx";
import type { TestingPolicy } from "@/lib/types";

/**
 * The stored values — Test-Blind, Test-Free, Test-Optional — are admissions
 * jargon. They're the right vocabulary for the data (they're what each school's
 * page is verified against, and what the directory filters on) but a student
 * doesn't know the difference between blind and free, and shouldn't have to.
 * So the label answers the only question they actually have: does my SAT matter
 * here.
 *
 * Test-Blind and Test-Free deliberately read the same. The distinction is about
 * how a school describes itself, not about what happens to your score, and
 * making a visitor decode it served nobody.
 */
export const POLICY_LABEL: Record<TestingPolicy, string> = {
  "Test-Required": "SAT/ACT required",
  "Test-Optional": "SAT/ACT optional",
  "Test-Free": "Doesn't use SAT/ACT",
  "Test-Blind": "Doesn't use SAT/ACT",
  "Test-Expected": "SAT/ACT expected",
  "Varies by college": "Depends on your college",
  "Not verified": "Not confirmed yet",
};

const META: Record<TestingPolicy, { style: string; note: string }> = {
  "Test-Required": {
    style: "bg-[#f7edea] text-[#8a4a38] ring-1 ring-inset ring-[#ecd7d0]",
    note: "You must submit SAT or ACT scores to apply here.",
  },
  "Test-Optional": {
    style: "bg-[#f4efe3] text-[#775f2c] ring-1 ring-inset ring-[#e6dac2]",
    note: "You choose whether to send scores. They're read if you do, so send them only if they help.",
  },
  "Test-Free": {
    style: "bg-[#ecf2ec] text-[#2f5540] ring-1 ring-inset ring-[#d5e4d8]",
    note: "This school doesn't look at SAT or ACT scores for admission, even if you send them.",
  },
  "Test-Blind": {
    style: "bg-[#ecf2ec] text-[#2f5540] ring-1 ring-inset ring-[#d5e4d8]",
    note: "This school doesn't look at SAT or ACT scores for admission, even if you send them.",
  },
  "Test-Expected": {
    style: "bg-[#f4efe3] text-[#775f2c] ring-1 ring-inset ring-[#e6dac2]",
    note: "This school expects scores and will accept an application without them. Sending them is the safer choice unless you have a reason not to.",
  },
  "Varies by college": {
    style: "bg-[#f4efe3] text-[#775f2c] ring-1 ring-inset ring-[#e6dac2]",
    note: "The rule depends on which college or programme you apply to here. Check the note on this school's profile.",
  },
  "Not verified": {
    style: "bg-white text-[#6f6a60] ring-1 ring-inset ring-[#ddd6c9]",
    note: "We haven't confirmed this school's test policy on its own admissions page yet. Check the school's site.",
  },
};

export default function TestingPolicyBadge({
  policy,
  className,
}: {
  policy: TestingPolicy;
  className?: string;
}) {
  const meta = META[policy];
  return (
    <span
      title={meta.note}
      className={clsx(
        "inline-flex cursor-help items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.style,
        className
      )}
    >
      {POLICY_LABEL[policy]}
    </span>
  );
}
