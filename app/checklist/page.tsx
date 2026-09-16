"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { checklistData, GRADE_LABELS, GRADE_TAGLINES } from "@/lib/checklistData";
import type { Grade } from "@/lib/types";
import ChecklistIcon from "@/components/ChecklistIcon";
import ProgressBar from "@/components/ProgressBar";

const GRADES: Grade[] = [9, 10, 11];
const STORAGE_KEY = "pathfinder-admit:checklist-progress";

type ProgressState = Record<string, boolean>;

export default function ChecklistPage() {
  const [grade, setGrade] = useState<Grade>(9);
  const [progress, setProgress] = useState<ProgressState>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch {
      // ignore malformed/unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore unavailable storage
    }
  }, [progress, loaded]);

  const categories = checklistData[grade];

  const toggleItem = (id: string) => {
    setProgress((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { totalItems, completedItems } = useMemo(() => {
    const allIds = categories.flatMap((c) => c.items.map((i) => i.id));
    return {
      totalItems: allIds.length,
      completedItems: allIds.filter((id) => progress[id]).length,
    };
  }, [categories, progress]);

  const overallPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          High School Runway Checklist
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          A grade-specific action plan across academics, testing, extracurriculars, research, and
          financial planning.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                grade === g ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              Grade {g}
            </button>
          ))}
        </div>
        <div className="min-w-[200px] flex-1 sm:max-w-xs">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Overall progress</span>
            <span>
              {completedItems}/{totalItems}
            </span>
          </div>
          <ProgressBar percent={overallPercent} className="mt-1.5" />
        </div>
      </div>

      <div className="rounded-2xl bg-navy-900 px-6 py-5 text-white">
        <div className="text-sm font-bold text-gold-400">{GRADE_LABELS[grade]}</div>
        <p className="mt-1 text-sm text-slate-300">{GRADE_TAGLINES[grade]}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {categories.map((category) => {
          const done = category.items.filter((i) => progress[i.id]).length;
          const pct = category.items.length > 0 ? (done / category.items.length) * 100 : 0;
          return (
            <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
                    <ChecklistIcon name={category.icon} className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-bold text-navy-900">{category.title}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {done}/{category.items.length}
                </span>
              </div>
              <ProgressBar percent={pct} className="mt-3" />

              <ul className="mt-4 space-y-2.5">
                {category.items.map((item) => {
                  const checked = !!progress[item.id];
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span
                          className={clsx(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            checked ? "border-gold-500 bg-gold-500" : "border-slate-300"
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5 text-navy-950" strokeWidth={3} />}
                        </span>
                        <span
                          className={clsx(
                            "text-sm leading-snug",
                            checked ? "text-slate-400 line-through" : "text-slate-600"
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
