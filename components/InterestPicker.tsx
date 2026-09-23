"use client";

import { Check } from "lucide-react";
import clsx from "clsx";
import { INTEREST_TAXONOMY } from "@/lib/interests";
import { INTEREST_SUB_AREAS } from "@/lib/interestFields";
import { MAX_INTERESTS, type InterestChoice } from "@/lib/profile";

/**
 * Up to MAX_INTERESTS fields of interest, each with its own sub-areas (e.g.
 * Engineering -> Mechanical, Electrical, CS, Biomedical). "Undecided" is its
 * own state, mutually exclusive with picking fields — selecting it clears any
 * chosen fields rather than leaving them selected-but-ignored.
 */
export default function InterestPicker({
  interests,
  undecided,
  onChange,
}: {
  interests: InterestChoice[];
  undecided: boolean;
  onChange: (next: { interests: InterestChoice[]; undecided: boolean }) => void;
}) {
  const toggleUndecided = () => {
    if (undecided) onChange({ interests, undecided: false });
    else onChange({ interests: [], undecided: true });
  };

  const toggleField = (fieldId: string) => {
    const exists = interests.some((i) => i.fieldId === fieldId);
    if (exists) {
      onChange({ interests: interests.filter((i) => i.fieldId !== fieldId), undecided: false });
      return;
    }
    if (interests.length >= MAX_INTERESTS) return;
    onChange({ interests: [...interests, { fieldId, subAreas: [] }], undecided: false });
  };

  const toggleSubArea = (fieldId: string, subArea: string) => {
    onChange({
      undecided,
      interests: interests.map((i) => {
        if (i.fieldId !== fieldId) return i;
        const has = i.subAreas.includes(subArea);
        return { ...i, subAreas: has ? i.subAreas.filter((s) => s !== subArea) : [...i.subAreas, subArea] };
      }),
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleUndecided}
        aria-pressed={undecided}
        className={clsx(
          "mb-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          undecided ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        {undecided && <Check className="h-3 w-3" strokeWidth={3} />}
        Undecided
      </button>

      {!undecided && (
        <>
          <p className="text-xs text-slate-500">Pick up to {MAX_INTERESTS}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_TAXONOMY.map((field) => {
              const selected = interests.some((i) => i.fieldId === field.id);
              const disabled = !selected && interests.length >= MAX_INTERESTS;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => toggleField(field.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={clsx(
                    "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    selected
                      ? "border-navy-900 bg-navy-900 text-white"
                      : disabled
                        ? "border-slate-100 text-slate-300"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  {field.label}
                </button>
              );
            })}
          </div>

          {interests.length > 0 && (
            <div className="mt-4 space-y-3">
              {interests.map((choice) => {
                const field = INTEREST_TAXONOMY.find((f) => f.id === choice.fieldId);
                const subAreas = INTEREST_SUB_AREAS[choice.fieldId] ?? [];
                if (!field || subAreas.length === 0) return null;
                return (
                  <div key={choice.fieldId} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-bold text-navy-900">{field.label} — sub-areas</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subAreas.map((sub) => {
                        const selected = choice.subAreas.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubArea(choice.fieldId, sub)}
                            aria-pressed={selected}
                            className={clsx(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                              selected
                                ? "border-gold-500 bg-gold-50 text-navy-900"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                            )}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
