"use client";

import { useState } from "react";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import clsx from "clsx";
import type { College } from "@/lib/types";
import { addToApplications, ROUND_LABELS, type ApplicationRound } from "@/lib/collegeList";

const KNOWN_ROUNDS: ApplicationRound[] = ["ED", "EA", "REA", "RD"];

/** Rounds this school's own curated application-plan data actually verifies — never a guessed/default set. */
function verifiedRounds(college: College): ApplicationRound[] {
  const types = new Set(college.applicationPlans.map((p) => p.type));
  return KNOWN_ROUNDS.filter((r) => types.has(r));
}

/**
 * "Add to my applications": offers only the rounds this school's own data
 * verifies (see verifiedRounds). When none are verified, the only choice is
 * "Round not selected," which links out to the school's admissions page
 * instead of presenting an unverified round as if it were confirmed.
 */
export default function AddToApplicationsButton({
  college,
  className,
  /** Set once a school is already Applying+, so the same picker becomes "Change round" instead of adding it fresh. */
  alreadyApplying = false,
}: {
  college: College;
  className?: string;
  alreadyApplying?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rounds = verifiedRounds(college);

  const choose = (round: ApplicationRound | null) => {
    addToApplications(college.id, round);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          alreadyApplying
            ? clsx("text-xs font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700", className)
            : clsx(
                "inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800",
                className
              )
        }
      >
        {!alreadyApplying && <ClipboardCheck className="h-3.5 w-3.5" />}
        {alreadyApplying ? "Change round" : "Add to my applications"}
      </button>
    );
  }

  return (
    <div
      className={clsx("rounded-xl border border-slate-200 bg-white p-3", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-navy-900">
        {rounds.length > 0 ? "Which round?" : "No verified round for this school yet"}
      </p>
      {rounds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rounds.map((round) => (
            <button
              key={round}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                choose(round);
              }}
              title={ROUND_LABELS[round]}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-navy-900 hover:text-navy-900"
            >
              {round}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            choose(null);
          }}
          className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:border-slate-400"
        >
          Round not selected
        </button>
        {college.website && (
          <a
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-navy-900"
          >
            Confirm on the official page <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }}
        className="mt-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
      >
        Cancel
      </button>
    </div>
  );
}
