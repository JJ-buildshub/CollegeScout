"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { addPathwayToPlan, removePathwayFromPlan, usePathwayPlan } from "@/lib/tasks";

export default function AddPathwayToPlanButton({ slug }: { slug: string }) {
  const { slugs } = usePathwayPlan();
  const added = slugs.includes(slug);

  if (!added) {
    return (
      <button
        type="button"
        onClick={() => addPathwayToPlan(slug)}
        className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
      >
        <Plus className="h-4 w-4" /> Add to My Plan
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-4 py-2 text-sm font-semibold text-navy-900">
        <Check className="h-4 w-4 text-gold-700" strokeWidth={3} /> Added to My Plan
      </span>
      <Link href="/checklist" className="text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
        View My Plan
      </Link>
      <button
        type="button"
        onClick={() => removePathwayFromPlan(slug)}
        className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-rose-700"
      >
        Remove
      </button>
    </div>
  );
}
