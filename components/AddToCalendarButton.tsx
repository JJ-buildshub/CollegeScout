"use client";

import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { buildCalendarFile, summerCalendarDeadlines } from "@/lib/calendar";

/** Downloads the saved programs' deadlines as a file any calendar app can import. Nothing is sent anywhere. */
export default function AddToCalendarButton({ ids }: { ids: string[] }) {
  // Which deadlines are still ahead depends on today, so this waits for the browser.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const deadlines = today ? summerCalendarDeadlines(ids, today) : [];
  if (deadlines.length === 0) return null;

  const download = () => {
    const url = URL.createObjectURL(new Blob([buildCalendarFile(deadlines, new Date())], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "collegescout-deadlines.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy-900 ring-1 ring-slate-300 hover:bg-slate-100"
    >
      <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
      Add {deadlines.length} {deadlines.length === 1 ? "deadline" : "deadlines"} to my calendar
    </button>
  );
}
