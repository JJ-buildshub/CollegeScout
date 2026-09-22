"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store shared by every component that reads it.
 * `write()` from anywhere (Explore, My Fit, My Plan, a college profile) is
 * seen immediately by every other mounted component subscribed to the same
 * store, in the same tab — this is what makes a status change on one page
 * "show up everywhere" without a full page reload. The browser's own
 * `storage` event only fires in *other* tabs, so it isn't enough on its own;
 * this adds the same-tab, same-render-tree half of that.
 *
 * Falls back silently to in-memory-only state if localStorage is unavailable
 * (private browsing, blocked storage, SSR) — never throws, never guesses at
 * data. Reading happens lazily on first access so this module has no
 * server/client mismatch: the server snapshot is always `initial`.
 *
 * Every write is stamped with `version` in a small envelope, `{ v, data }`,
 * so a future schema change has something real to branch on. `migrate`
 * receives whatever was actually on disk — the unwrapped `data` from a
 * versioned envelope, or the raw parsed value for data written before this
 * envelope existed (schema version 0) — and should merge it against
 * `initial` defensively rather than assume every field is present.
 *
 * If the stored JSON fails to parse (corrupted data, a hand-edited value,
 * truncated storage), the raw string is preserved under `${key}:corrupted`
 * rather than discarded, `wasCorrupted()` starts returning true so the UI can
 * surface it, and the store falls back to `initial` in memory. Nothing here
 * is ever silently lost.
 */
export function createLocalStore<T>(
  key: string,
  initial: T,
  version: number,
  migrate?: (raw: unknown, storedVersion: number) => T | null
) {
  let state: T = initial;
  let hydrated = false;
  let corrupted = false;
  const listeners = new Set<() => void>();

  function readFromDisk(): T {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      const isEnvelope = parsed && typeof parsed === "object" && "v" in parsed && "data" in parsed;
      const storedVersion: number = isEnvelope ? (parsed as { v: number }).v : 0;
      const data: unknown = isEnvelope ? (parsed as { data: unknown }).data : parsed;
      const result = migrate ? migrate(data, storedVersion) : { ...initial, ...(data as object) };
      return result ?? initial;
    } catch {
      corrupted = true;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) window.localStorage.setItem(`${key}:corrupted`, raw);
      } catch {
        // if we can't even back it up, there's nothing more to do
      }
      return initial;
    }
  }

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    state = readFromDisk();
    hydrated = true;
  }

  function persist(next: T) {
    state = next;
    try {
      window.localStorage.setItem(key, JSON.stringify({ v: version, data: next }));
    } catch {
      // Storage unavailable (private mode, quota, etc.) — keep working in memory only.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function getSnapshot() {
    ensureHydrated();
    return state;
  }

  function getServerSnapshot() {
    return initial;
  }

  function set(updater: T | ((prev: T) => T)) {
    ensureHydrated();
    const next = typeof updater === "function" ? (updater as (prev: T) => T)(state) : updater;
    persist(next);
  }

  function get(): T {
    ensureHydrated();
    return state;
  }

  /** True once this session found unparseable JSON under this key (see the corruption note above). */
  function wasCorrupted(): boolean {
    ensureHydrated();
    return corrupted;
  }

  /** Wipes this store back to its default, in memory and on disk. Used by "Reset my data." */
  function reset() {
    corrupted = false;
    persist(initial);
  }

  /** Hook form: re-renders the calling component on any write to this store, from anywhere. */
  function useStore(): [T, (updater: T | ((prev: T) => T)) => void] {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return [snapshot, set];
  }

  return { useStore, get, set, subscribe, wasCorrupted, reset };
}
