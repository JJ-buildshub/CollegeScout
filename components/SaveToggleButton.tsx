"use client";

import { Bookmark } from "lucide-react";
import clsx from "clsx";
import { toggleSaved, useCollegeList } from "@/lib/collegeList";

export default function SaveToggleButton({
  collegeId,
  className,
}: {
  collegeId: string;
  className?: string;
}) {
  const { state } = useCollegeList();
  const saved = state.entries[collegeId] !== undefined;

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from my list" : "Save this school"}
      title={saved ? "Remove from my list" : "Save this school"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(collegeId);
      }}
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
        saved ? "bg-gold-500 text-navy-950" : "bg-slate-100 text-slate-400 hover:bg-slate-200",
        className
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
