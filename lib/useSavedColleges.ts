"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pathfinder-admit:saved-colleges";

function readSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function readSavedIds(): string[] {
  return [...readSaved()];
}

export function useSavedColleges() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSaved(readSaved());
    setLoaded(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore unavailable storage
      }
      return next;
    });
  }, []);

  return { saved, loaded, toggle, isSaved: (id: string) => saved.has(id) };
}
