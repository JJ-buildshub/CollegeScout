"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ExternalLink, MapPin, Search } from "lucide-react";
import { areaMatch, lookupZip, type AreaMatch, type ZipLookup } from "@/lib/zipCounties";
import {
  FEE_NOT_STATED,
  SCHOLARSHIP_GRADES,
  changedPrograms,
  confirmedItems,
  daysLeft,
  isConfirmed,
  isFree,
  scholarships,
  scholarshipsChecked,
  type Scholarship,
  type ScholarshipGrade,
} from "@/lib/scholarships";

const ordinal = (grade: ScholarshipGrade) => `${grade}th`;

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

/**
 * The server renders this page once at build time, so "days left" cannot be in
 * that HTML. `today` stays null until the browser mounts, and anything that
 * depends on the date waits for it.
 */
function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

type Timing = { tone: "open" | "closed" | "plain"; label: string };

function timing(program: Scholarship, today: Date | null): Timing {
  const days = today ? daysLeft(program, today) : null;
  const short = program.deadlineShort ?? (isConfirmed(program.deadline) ? program.deadline : "Date not posted yet");
  if (days === null) return { tone: "plain", label: `Due: ${short}` };
  if (days < 0) return { tone: "closed", label: `Closed ${short}. Back next year` };
  if (days === 0) return { tone: "open", label: `Due today, ${short}` };
  return { tone: "open", label: `${days} ${days === 1 ? "day" : "days"} left · due ${short}` };
}

function NotConfirmed() {
  return (
    <span className="rounded-md bg-sand-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
      We couldn&apos;t confirm this yet
    </span>
  );
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: Timing["tone"] | "gold" }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-bold",
        tone === "open" && "bg-gold-100 text-gold-700",
        tone === "closed" && "bg-slate-100 text-slate-500",
        tone === "plain" && "bg-sand-100 text-slate-600",
        tone === "gold" && "bg-navy-900 text-gold-400"
      )}
    >
      {children}
    </span>
  );
}

function Detail({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  const shown = confirmedItems(items);
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-sm font-extrabold text-navy-900">{title}</h3>
      {shown.length === 0 ? (
        <div className="mt-2">
          <NotConfirmed />
        </div>
      ) : (
        <List
          className={clsx(
            "mt-2 space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700",
            ordered ? "list-decimal" : "list-disc"
          )}
        >
          {shown.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      )}
    </div>
  );
}

const ZIP_KEY = "collegescout.scholarships.zip";

/** The ZIP is a convenience kept in this browser only; the page works without storage. */
function useSavedZip() {
  const [zip, setZip] = useState("");
  useEffect(() => {
    try {
      setZip(window.localStorage.getItem(ZIP_KEY) ?? "");
    } catch {
      // storage blocked: start empty
    }
  }, []);
  const update = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setZip(digits);
    try {
      if (digits) window.localStorage.setItem(ZIP_KEY, digits);
      else window.localStorage.removeItem(ZIP_KEY);
    } catch {
      // storage blocked: keep it for this visit only
    }
  };
  return [zip, update] as const;
}

function placeLabel(place: ZipLookup) {
  if (place.status !== "found") return "";
  const [first, ...rest] = place.counties;
  return rest.length ? `${first} County (and part of ${rest.join(", ")})` : `${first} County`;
}

function ScholarshipCard({
  program,
  today,
  match,
}: {
  program: Scholarship;
  today: Date | null;
  match: AreaMatch;
}) {
  const when = timing(program, today);
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-card open:border-navy-900">
      <summary className="cursor-pointer list-none p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <p className="min-w-0 flex-1 font-display text-2xl font-extrabold leading-tight text-navy-900 sm:text-3xl">
            {program.prize ?? program.name}
          </p>
          <span
            className="mt-1 text-sm font-semibold text-slate-500 group-open:hidden"
            aria-hidden="true"
          >
            See how &#9662;
          </span>
          <span className="mt-1 hidden text-sm font-semibold text-slate-500 group-open:inline" aria-hidden="true">
            Close &#9652;
          </span>
        </div>
        {program.prize && <h2 className="mt-1 text-base font-bold text-navy-900">{program.name}</h2>}
        <p className="text-xs font-medium text-slate-500">from {program.runBy}</p>

        {program.tagline && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">{program.tagline}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip tone={when.tone}>{when.label}</Chip>
          {program.task && <Chip>You make: {program.task}</Chip>}
          {isFree(program) && <Chip>Free to enter</Chip>}
          {match === "covers" && <Chip tone="open">Covers where you live</Chip>}
          {match === "maybe" && <Chip>May cover where you live: check with them</Chip>}
          {program.local && <Chip>{program.area ?? "Through a local club"}</Chip>}
          {program.only && <Chip tone="closed">Only for: {program.only}</Chip>}
          <Chip tone="gold">
            {program.grades.length === 4 ? "Any grade, 9th to 12th" : `${program.grades.map(ordinal).join(" and ")} grade`}
          </Chip>
        </div>
      </summary>

      <div className="space-y-5 border-t border-slate-100 p-5">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <Detail title="Can I enter?" items={program.eligibility} />
          <Detail title="What do I make or send in?" items={program.whatYouSubmit} />
          <Detail title="How it works, step by step" items={program.howToApply} ordered />
          <Detail title="What to do now" items={program.prepare} />
        </div>

        <dl className="grid gap-3 rounded-xl bg-sand-50 p-4 text-sm sm:grid-cols-2">
          {[
            ["What you can win", program.award],
            ["Deadline", program.deadline],
            ["Opens", program.opens],
            ["Cost to enter", program.fee === FEE_NOT_STATED ? "" : program.fee],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold text-slate-500">{label}</dt>
              <dd className="mt-0.5 leading-relaxed text-navy-900">{isConfirmed(value) ? value : <NotConfirmed />}</dd>
            </div>
          ))}
        </dl>

        {program.notes && (
          <p className="text-xs leading-relaxed text-slate-500">
            <span className="font-bold text-slate-600">Heads up: </span>
            {program.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Straight from{" "}
            {program.sources.map((source, i) => (
              <span key={source.url}>
                {i > 0 && ", "}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.label}
                  className="underline underline-offset-2 hover:text-navy-900"
                >
                  {hostname(source.url)}
                  {program.sources.length > 1 && ` (${i + 1})`}
                </a>
              </span>
            ))}{" "}
            &middot; we checked on {formatDate(scholarshipsChecked)}
          </p>
          <div className="flex flex-wrap gap-2">
            {program.findLocal && (
              <a
                href={program.findLocal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-navy-900 ring-1 ring-navy-900 hover:bg-sand-50"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Find one near you
              </a>
            )}
            <a
              href={program.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-800"
            >
              Go to the official page
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function ScholarshipsPage() {
  const today = useToday();
  const [grade, setGrade] = useState<ScholarshipGrade | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState<"all" | "national" | "local">("all");
  const [zip, setZip] = useSavedZip();
  const place = useMemo(() => lookupZip(zip), [zip]);

  const shown = useMemo(() => {
    // Soonest deadline first, then programs with no single date, then ones already closed.
    const rank = (program: Scholarship) => {
      const days = today ? daysLeft(program, today) : null;
      if (days === null) return 10_000;
      return days < 0 ? 20_000 - days : days;
    };
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (program: Scholarship) => {
      const text = [program.name, program.runBy, program.task, program.tagline, program.prize].join(" ").toLowerCase();
      return words.every((word) => text.includes(word));
    };
    return scholarships
      .filter(matches)
      .filter((program) => grade === null || program.grades.includes(grade))
      .filter((program) => where === "all" || (where === "local") === Boolean(program.local))
      .filter((program) => areaMatch(program, place) !== "no")
      .filter((program) => !openOnly || !today || (daysLeft(program, today) ?? 0) >= 0)
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [grade, openOnly, place, query, today, where]);

  const needle = query.trim().toLowerCase();
  const changedShown = changedPrograms.filter((program) =>
    `${program.name} ${program.runBy}`.toLowerCase().includes(needle)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <div className="rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Scholarships</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Money for college you can win <span className="text-gold-400">before you graduate</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
          Some of these start in 9th grade. Most people find out senior year, when the biggest deadlines are already
          gone. Pick your grade and see what you can start on today.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-gold-400">
          <li>No sign-up</li>
          <li>Nothing copied from a reel</li>
          <li>Verified, not viral</li>
        </ul>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-extrabold text-navy-900">What grade are you in?</p>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by grade">
          {[...SCHOLARSHIP_GRADES, null].map((option) => (
            <button
              key={option ?? "all"}
              type="button"
              aria-pressed={grade === option}
              onClick={() => setGrade(option)}
              className={clsx(
                "rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                grade === option
                  ? "bg-navy-900 text-gold-400"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-navy-900"
              )}
            >
              {option === null ? "All grades" : ordinal(option)}
            </button>
          ))}
        </div>
        <p className="pt-2 text-sm font-extrabold text-navy-900">Where?</p>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by where it is run">
          {(
            [
              ["all", "Anywhere"],
              ["national", "National only"],
              ["local", "Near you"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={where === value}
              onClick={() => setWhere(value)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                where === value
                  ? "bg-gold-400 text-navy-950"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-navy-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="zip" className="text-sm font-semibold text-slate-600">
            Your ZIP code
          </label>
          <input
            id="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            placeholder="92101"
            className="w-28 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          {zip && (
            <button
              type="button"
              onClick={() => setZip("")}
              className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-navy-900"
            >
              Clear
            </button>
          )}
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-slate-500" aria-live="polite">
          {place.status === "empty" &&
            "Optional. Add it to hide regional programs that don't cover where you live. It stays in this browser and isn't sent anywhere."}
          {place.status === "incomplete" && "Keep going: a ZIP code has 5 digits."}
          {place.status === "found" && (
            <>
              <span className="font-bold text-navy-900">{placeLabel(place)}.</span> Regional programs that don&apos;t
              cover it are hidden. Local clubs and national programs still show, since they&apos;re open almost
              everywhere.
            </>
          )}
          {place.status === "unknown-ca" &&
            "That looks like a California ZIP we can't place in a county. PO box ZIPs aren't in our list, so try your home ZIP. Statewide programs still show."}
          {place.status === "other-state" &&
            "We only know California ZIP codes so far, so California programs are hidden. Local clubs and national programs still show."}
        </p>
        {where === "local" && (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            These are handed out by a club, post or chapter in your own area, so you&apos;re only up against
            students near you. Each one sets its own amount and deadline. You have to ask.
          </p>
        )}
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Coca-Cola, essay, science, speech"
            aria-label="Search scholarships by name or type"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(event) => setOpenOnly(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-navy-900"
          />
          Hide the ones that already closed this year
        </label>
      </div>

      <p className="text-sm font-semibold text-slate-600" aria-live="polite">
        {shown.length === 0
          ? changedShown.length > 0 && needle
            ? "That one changed its rules. See below."
            : "Nothing matches yet."
          : `${shown.length} ${shown.length === 1 ? "thing" : "things"} you can go for${
              grade !== null ? ` in ${ordinal(grade)} grade` : ""
            }. Tap one to see how.`}
      </p>

      {shown.length === 0 ? (
        <div
          className={clsx(
            "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-card",
            changedShown.length > 0 && needle && "hidden"
          )}
        >
          We haven&apos;t confirmed anything that matches. Check the spelling, try another grade, or show the
          ones that closed so you know what&apos;s coming next year.
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((program) => (
            <ScholarshipCard key={program.id} program={program} today={today} match={areaMatch(program, place)} />
          ))}
        </div>
      )}

      {changedShown.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-extrabold text-navy-900">Heard about these? The rules changed</h2>
          <p className="mt-1 text-sm text-slate-600">
            Old posts and videos still share these the way they used to work. Here&apos;s what their own sites say now.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {changedShown.map((program) => (
              <div key={program.id} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-sm font-bold text-navy-900">
                  {program.name} <span className="font-medium text-slate-500">from {program.runBy}</span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  <span className="font-bold">What you may have heard: </span>
                  {program.heard}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  <span className="font-bold text-navy-900">What it says now: </span>
                  {program.now}
                </p>
                <a
                  href={program.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-navy-900 underline underline-offset-2"
                >
                  Straight from {hostname(program.homepage)}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        We read each organization&apos;s own website and quote it. If we couldn&apos;t find something there, we say so
        instead of guessing. Rules and dates change, so read the official page before you apply.{" "}
        <Link href="/about-data" className="font-semibold text-navy-900 underline underline-offset-2">
          How we check our data
        </Link>
      </p>
    </div>
  );
}
