"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { PathwayCard, PathwayCategory, PathwayCategoryId } from "@/lib/pathways";

const BADGE_STYLE: Record<PathwayCard["badge"], string> = {
  Mainstream: "bg-slate-100 text-slate-600",
  Niche: "bg-gold-100 text-gold-700",
  "Counts in your app": "border border-slate-200 bg-white text-slate-600",
};

function CardBody({ card, categoryLabel, live }: { card: PathwayCard; categoryLabel: string; live: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{categoryLabel}</span>
        <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", BADGE_STYLE[card.badge])}>{card.badge}</span>
      </div>
      <h3 className={clsx("mt-1.5 text-lg font-extrabold tracking-tight", live ? "text-navy-900 group-hover:text-gold-600" : "text-slate-600")}>
        {card.title}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-snug text-slate-500">{card.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-500">Starts: {card.starts}</span>
        {live ? (
          <span className="inline-flex items-center gap-1 font-bold text-navy-900 group-hover:text-gold-600">
            Read <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="font-semibold text-slate-400">Coming soon</span>
        )}
      </div>
    </>
  );
}

export default function PathwayExplorer({
  categories,
  cards,
  liveSlugs,
}: {
  categories: PathwayCategory[];
  cards: PathwayCard[];
  liveSlugs: string[];
}) {
  const [filter, setFilter] = useState<PathwayCategoryId | "all">("all");
  const labelFor = (id: PathwayCategoryId) => categories.find((c) => c.id === id)?.label ?? id;
  const shown = filter === "all" ? cards : cards.filter((c) => c.category === filter);
  const chips: { id: PathwayCategoryId | "all"; label: string }[] = [{ id: "all", label: "All" }, ...categories];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pathways">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            aria-pressed={filter === chip.id}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === chip.id ? "bg-navy-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy-900"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((card) => {
          const live = liveSlugs.includes(card.slug);
          const categoryLabel = labelFor(card.category);
          return live ? (
            <Link
              key={card.slug}
              href={`/beyond-grades/${card.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
            >
              <CardBody card={card} categoryLabel={categoryLabel} live />
            </Link>
          ) : (
            <div key={card.slug} className="flex h-full flex-col rounded-2xl border border-dashed border-slate-300 bg-sand-50 p-5">
              <CardBody card={card} categoryLabel={categoryLabel} live={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
