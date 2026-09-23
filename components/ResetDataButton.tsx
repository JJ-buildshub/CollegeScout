"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import clsx from "clsx";
import { resetAllCollegeScoutData } from "@/lib/dataReset";

/** Clears your profile, college list and tasks from this browser, after a confirm step. */
export default function ResetDataButton({ className, label = "Reset my data" }: { className?: string; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className={clsx("inline-flex items-center gap-2 text-xs", className)}>
        <span className="font-semibold text-slate-600">Erase your profile, list and tasks from this browser?</span>
        <button
          type="button"
          onClick={() => {
            resetAllCollegeScoutData();
            setConfirming(false);
          }}
          className="rounded-full bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700"
        >
          Yes, erase it
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold text-slate-500 hover:border-slate-300"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600", className)}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
