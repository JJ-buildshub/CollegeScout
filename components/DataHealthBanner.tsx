"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { anyDataCorrupted } from "@/lib/dataReset";
import ResetDataButton from "./ResetDataButton";

/**
 * Shows only when a store found unparseable JSON on load (see the corruption
 * handling in lib/store.ts). The original bad data is kept under
 * "<key>:corrupted" in localStorage rather than deleted, so this is reporting
 * a problem, not the only place the data still exists.
 */
export default function DataHealthBanner() {
  const [corrupted, setCorrupted] = useState(false);

  useEffect(() => {
    setCorrupted(anyDataCorrupted());
  }, []);

  if (!corrupted) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Some of your saved CollegeScout data couldn&apos;t be read and was reset to default. The original is kept in
          this browser in case you need it, but nothing here will use it.
        </span>
        <ResetDataButton className="ml-auto" label="Clear and start fresh" />
      </div>
    </div>
  );
}
