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
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-[opacity,background-color,color] duration-150",
        // The saved state lives in localStorage, so it isn't known until the page has loaded in the
        // browser. Fading in after that avoids a saved school flashing grey and then turning gold.
        loaded ? "opacity-100" : "opacity-0",
        saved ? "bg-gold-500 text-navy-950" : "bg-slate-100 text-slate-400 hover:bg-slate-200",
        className
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
