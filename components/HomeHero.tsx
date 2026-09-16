"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, User, Users } from "lucide-react";
import { colleges } from "@/lib/colleges";

type Persona = "student" | "parent";

const PERSONA_STORAGE_KEY = "pathfinder-admit:persona";

const PERSONA_BULLETS: Record<Persona, string[]> = {
  student: [
    "Find schools that fit you",
    "Explore majors and careers",
    "See where you stand",
    "Know what to do next",
  ],
  parent: [
    "Understand your student's options",
    "Compare academics, outcomes and cost",
    "Build a realistic application strategy",
    "Track important milestones",
  ],
};

export default function HomeHero() {
  const [persona, setPersona] = useState<Persona>("student");

  useEffect(() => {
    try {
      const savedPersona = localStorage.getItem(PERSONA_STORAGE_KEY);
      if (savedPersona === "student" || savedPersona === "parent") setPersona(savedPersona);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const setPersonaAndPersist = (p: Persona) => {
    setPersona(p);
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, p);
    } catch {
      // ignore unavailable storage
    }
  };

  const bullets = PERSONA_BULLETS[persona];

  return (
    <section className="overflow-hidden rounded-3xl bg-navy-900 px-6 py-16 text-white sm:px-12 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-400">
          National College Intelligence &middot; {colleges.length}+ Schools
        </span>

        <div className="mx-auto mt-6 inline-flex rounded-full bg-white/10 p-1">
          <PersonaButton active={persona === "student"} onClick={() => setPersonaAndPersist("student")}>
            <User className="h-4 w-4" /> I am a Student
          </PersonaButton>
          <PersonaButton active={persona === "parent"} onClick={() => setPersonaAndPersist("parent")}>
            <Users className="h-4 w-4" /> I am a Parent/Guardian
          </PersonaButton>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Find colleges you didn&apos;t know to look for.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
          Go beyond rankings. Explore schools based on your academics, interests, programs, career
          outcomes, campus life, and what matters to you.
        </p>

        <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
          >
            Scout Colleges <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/matcher"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Find My Matches <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PersonaButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm",
        active ? "bg-gold-500 text-navy-950" : "text-slate-300 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
