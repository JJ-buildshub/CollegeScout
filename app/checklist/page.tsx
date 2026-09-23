"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { GRADE_LABELS, GRADE_TAGLINES } from "@/lib/checklistData";
import { useProfile } from "@/lib/profile";
import { entriesWithStatusAtLeast, useCollegeList } from "@/lib/collegeList";
import { getCollegeById } from "@/lib/colleges";
import {
  addCustomApplicationTask,
  addCustomPlanTask,
  buildApplicationTasks,
  buildPlanCategories,
  removeCustomTask,
  toggleTaskDone,
  useCustomTasks,
  useTaskProgress,
  type ApplicationTaskGroup,
  type PlanTask,
} from "@/lib/tasks";
import ChecklistIcon from "@/components/ChecklistIcon";
import ProgressBar from "@/components/ProgressBar";
import SchoolStatusBadge from "@/components/SchoolStatusBadge";

function TaskRow({ task, done, onToggle, onRemove }: { task: PlanTask; done: boolean; onToggle: () => void; onRemove?: () => void }) {
  return (
    <li className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50">
      <button onClick={onToggle} className="mt-0.5 flex shrink-0 items-start">
        <span
          className={clsx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            done ? "border-gold-500 bg-gold-500" : "border-slate-300"
          )}
        >
          {done && <Check className="h-3.5 w-3.5 text-navy-950" strokeWidth={3} />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <button onClick={onToggle} className="block w-full text-left">
          <span className={clsx("text-sm leading-snug", done ? "text-slate-500 line-through" : "text-slate-600")}>{task.label}</span>
        </button>
        {task.link && (
          <a
            href={task.link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 hover:text-gold-700"
          >
            {task.link.label} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
      {task.isCustom && onRemove && (
        <button onClick={onRemove} aria-label="Remove task" className="mt-0.5 shrink-0 text-slate-300 hover:text-rose-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function AddTaskInput({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value);
        setValue("");
      }}
      className="mt-2 flex items-center gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add your own task…"
        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-gold-500"
      />
      <button type="submit" className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
        <Plus className="h-3 w-3" /> Add
      </button>
    </form>
  );
}

export default function ChecklistPage() {
  const { profile } = useProfile();
  const { state: collegeListState } = useCollegeList();
  const { done } = useTaskProgress();
  const customTasks = useCustomTasks();

  const interestFieldIds = profile.undecided ? [] : profile.interests.map((i) => i.fieldId);

  const planCategories = useMemo(
    () => (profile.grade ? buildPlanCategories(profile.grade, interestFieldIds) : []),
    // Re-derives whenever grade, interests, or the custom-tasks store changes — task
    // *completion* (`done`) doesn't affect which tasks exist, only how they render below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.grade, JSON.stringify(interestFieldIds), customTasks]
  );

  const applicationGroups: ApplicationTaskGroup[] = useMemo(() => {
    return entriesWithStatusAtLeast(collegeListState, "Applying")
      .map((entry) => {
        const college = getCollegeById(entry.collegeId);
        return college ? buildApplicationTasks(college, entry) : null;
      })
      .filter((g): g is ApplicationTaskGroup => g !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeListState, customTasks]);

  const planTotal = planCategories.reduce((n, c) => n + c.tasks.length, 0);
  const planDone = planCategories.reduce((n, c) => n + c.tasks.filter((t) => done[t.id]).length, 0);
  const appTotal = applicationGroups.reduce((n, g) => n + g.tasks.length, 0);
  const appDone = applicationGroups.reduce((n, g) => n + g.tasks.filter((t) => done[t.id]).length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">My Plan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your high-school plan is based on your grade and interests from{" "}
          <Link href="/matcher" className="font-semibold text-navy-900 underline underline-offset-2">
            My Fit
          </Link>
          . Your applications section fills in once a school&apos;s status is Applying or later.
        </p>
      </div>

      {/* Section 1: Your high-school plan */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-900">Your High-School Plan</h2>
          {profile.grade && (
            <span className="text-xs font-semibold text-slate-500">
              {planDone}/{planTotal} complete
            </span>
          )}
        </div>

        {!profile.grade ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
            Set your current grade on{" "}
            <Link href="/matcher" className="font-semibold text-navy-900 underline underline-offset-2">
              My Fit
            </Link>{" "}
            to see your grade-by-grade plan.
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-2xl bg-navy-900 px-6 py-5 text-white">
              <div className="text-sm font-bold text-gold-400">{GRADE_LABELS[profile.grade]}</div>
              <p className="mt-1 text-sm text-slate-300">{GRADE_TAGLINES[profile.grade]}</p>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              {planCategories.map((category) => {
                const catDone = category.tasks.filter((t) => done[t.id]).length;
                const pct = category.tasks.length > 0 ? (catDone / category.tasks.length) * 100 : 0;
                return (
                  <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
                          <ChecklistIcon name={category.icon} className="h-4 w-4" />
                        </span>
                        <h3 className="text-sm font-bold text-navy-900">{category.title}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {catDone}/{category.tasks.length}
                      </span>
                    </div>
                    <ProgressBar percent={pct} className="mt-3" />
                    <ul className="mt-4 space-y-2.5">
                      {category.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          done={!!done[task.id]}
                          onToggle={() => toggleTaskDone(task.id)}
                          onRemove={task.isCustom ? () => removeCustomTask(task.id.replace(/^custom:/, "")) : undefined}
                        />
                      ))}
                      {category.tasks.length === 0 && (
                        <li className="text-xs text-slate-500">Nothing here yet — add your own below.</li>
                      )}
                    </ul>
                    {category.id === "custom" && <AddTaskInput onAdd={addCustomPlanTask} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Section 2: Your applications */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-900">Your Applications</h2>
          {applicationGroups.length > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              {appDone}/{appTotal} complete
            </span>
          )}
        </div>

        {applicationGroups.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
            No schools in progress yet. Use &quot;Add to my applications&quot; on{" "}
            <Link href="/matcher" className="font-semibold text-navy-900 underline underline-offset-2">
              My Fit
            </Link>{" "}
            or a school&apos;s profile page to start one.
          </div>
        ) : (
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {applicationGroups.map((group) => {
              const groupDone = group.tasks.filter((t) => done[t.id]).length;
              const pct = group.tasks.length > 0 ? (groupDone / group.tasks.length) * 100 : 0;
              return (
                <div key={group.collegeId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/directory/${group.collegeId}`} className="text-sm font-bold text-navy-900 hover:text-gold-600">
                      {group.collegeName}
                    </Link>
                    <SchoolStatusBadge status={group.status} round={group.round} />
                  </div>
                  <ProgressBar percent={pct} className="mt-3" />
                  <ul className="mt-4 space-y-2.5">
                    {group.tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        done={!!done[task.id]}
                        onToggle={() => toggleTaskDone(task.id)}
                        onRemove={task.isCustom ? () => removeCustomTask(task.id.replace(/^custom:/, ""), group.collegeId) : undefined}
                      />
                    ))}
                  </ul>
                  <AddTaskInput onAdd={(label) => addCustomApplicationTask(group.collegeId, label)} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
