"use client";

import { Bookmark } from "lucide-react";
import clsx from "clsx";
import { useSavedColleges } from "@/lib/useSavedColleges";

export default function SaveToggleButton({
  collegeId,
  className,
}: {
  collegeId: string;
  className?: string;
}) {
  const { isSaved, toggle, loaded } = useSavedColleges();
  const saved = loaded && isSaved(collegeId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from my list" : "Add to my list"}
      title={saved ? "Remove from my list" : "Add to my list"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(collegeId);
      }}
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
        saved ? "bg-gold-500 text-navy-950" : "bg-slate-100 text-slate-400 hover:bg-slate-200",
        className
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
