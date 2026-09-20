#!/usr/bin/env python3
"""
Aligns applicationPlans in data/colleges.json with the Common App grid data in
data/commonapp.json (written by scripts/import-commonapp-grid.py).

DRY RUN by default: prints every change and touches nothing. Pass --apply to
write data/colleges.json.

Usage:
    python scripts/sync-plans-from-commonapp.py            # show the diff
    python scripts/sync-plans-from-commonapp.py --apply    # write it

Rules (nothing is guessed):
- Only plans whose deadline is a plain date ("November 1") or empty are edited.
  A deadline with extra wording ("...; priority deadline for scholarships...")
  is left alone and reported, because it carries information a bare date would
  lose.
- Plans in the grid but missing here are added. ED and ED2 are binding and
  EA, EA2, REA and RD are non-binding by the definition of those plans; that
  is the only binding status this script ever sets.
- If the grid says a school is rolling but colleges.json has a dated Regular
  Decision, it's reported and left alone.
- A school is HELD BACK entirely (no edits, reported for a person to check) when
  colleges.json already lists a Rolling plan for it (the grid's last column mixes
  regular and rolling deadlines, so a dated "Regular Decision" would be wrong),
  or when the regular-decision dates differ by more than 14 days (a gap that
  large is more likely a different kind of deadline than a date shift).
- Only the applicationPlans (and applicationPlansProvenance) of matched
  schools are ever modified. Every other byte of the file is preserved.
- applicationPlansProvenance is set only for schools whose whole plan list is
  now backed by the grid (nothing left over that came from elsewhere).
"""
import io
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Grid plan key -> (our type, binding by definition)
PLAN_MAP = {
    "ED": ("ED", True),
    "EDII": ("ED2", True),
    "EA": ("EA", False),
    "EAII": ("EA2", False),
    "REA": ("REA", False),
    "RD": ("RD", False),
}
ORDER = ["ED", "ED2", "EA", "EA2", "REA", "RD", "Rolling", "Unspecified"]
PLAIN = re.compile(r"^[A-Za-z]+ \d{1,2}(, \d{4})?$")
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]


def month_day(text):
    m = re.match(r"\s*([A-Za-z]+)\s+(\d{1,2})", text or "")
    if not m or m.group(1).lower() not in MONTHS:
        return None
    return (MONTHS.index(m.group(1).lower()) + 1, int(m.group(2)))


def label(iso):
    d = date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}"


def main():
    apply = "--apply" in sys.argv
    colleges_path = os.path.join(ROOT, "data", "colleges.json")
    raw = open(colleges_path, encoding="utf-8", newline="").read()
    trailing_newline = raw.endswith("\n")
    colleges = json.loads(raw)
    commonapp = json.load(open(os.path.join(ROOT, "data", "commonapp.json"), encoding="utf-8"))
    source = commonapp["source"]

    changed = filled = added = 0
    notes = []
    held_schools = []
    schools_touched = 0

    for c in colleges:
        entry = commonapp["byCollege"].get(c["id"])
        if not entry:
            continue
        grid = entry.get("deadlines", {})
        plans = c["applicationPlans"]
        edits = []
        all_backed = True

        held = None
        if any(p["type"] == "Rolling" for p in plans):
            held = "already lists a Rolling plan; the grid's last column can't be split into regular vs rolling"
        else:
            rd_ours = next((p["deadline"] for p in plans if p["type"] == "RD" and p["deadline"] and PLAIN.match(p["deadline"])), None)
            rd_grid = grid.get("RD")
            if rd_ours and rd_grid and rd_grid != "Rolling" and month_day(rd_ours):
                g_date = date.fromisoformat(rd_grid)
                o_date = date(g_date.year, *month_day(rd_ours))
                if o_date < date(g_date.year, 7, 1):
                    o_date = date(g_date.year, *month_day(rd_ours))
                if abs((o_date - g_date).days) > 14:
                    held = f"regular decision differs by {abs((o_date - g_date).days)} days (yours {rd_ours}, grid {label(rd_grid)})"
        if held:
            held_schools.append(f"{c['name']}: {held}")
            continue

        for gkey, (ptype, binding) in PLAN_MAP.items():
            g = grid.get(gkey)
            if not g:
                continue
            existing = next((p for p in plans if p["type"] == ptype), None)
            if existing is None and ptype in ("EA2", "ED2"):
                # A second early round already listed under the first round's type
                # (e.g. two "EA" entries) that matches the grid's second-round date:
                # relabel it instead of adding a duplicate.
                base = "EA" if ptype == "EA2" else "ED"
                twins = [p for p in plans if p["type"] == base]
                match = next((p for p in twins[1:] if p["deadline"] and month_day(p["deadline"]) == (date.fromisoformat(g).month, date.fromisoformat(g).day)), None) if g != "Rolling" else None
                if match:
                    match["type"] = ptype
                    edits.append(f"  ~ relabel second {base} round as {ptype}: {match['deadline']}")
                    changed += 1
                    continue
            if g == "Rolling":
                if existing and existing["deadline"] and existing["type"] == "RD":
                    notes.append(f"{c['name']}: grid says rolling, colleges.json has Regular Decision {existing['deadline']} (left alone)")
                    all_backed = False
                continue
            new_label = label(g)
            gmd = (date.fromisoformat(g).month, date.fromisoformat(g).day)
            if existing is None:
                plans.append({"type": ptype, "binding": binding, "deadline": new_label})
                edits.append(f"  + add {ptype}: {new_label} ({'binding' if binding else 'non-binding'})")
                added += 1
            elif existing["deadline"] is None:
                existing["deadline"] = new_label
                edits.append(f"  ~ fill {ptype}: (blank) -> {new_label}")
                filled += 1
            elif PLAIN.match(existing["deadline"]):
                if month_day(existing["deadline"]) != gmd:
                    edits.append(f"  ~ change {ptype}: {existing['deadline']} -> {new_label}")
                    existing["deadline"] = new_label
                    changed += 1
            else:
                notes.append(f"{c['name']} {ptype}: kept \"{existing['deadline'][:70]}...\" (grid says {new_label})")
                all_backed = False

        # any plan of ours the grid doesn't cover means the list isn't wholly grid-backed
        covered = {PLAN_MAP[k][0] for k in grid if k in PLAN_MAP and grid[k] != "Rolling"}
        if any(p["type"] not in covered for p in plans):
            all_backed = False

        if edits:
            schools_touched += 1
            plans.sort(key=lambda p: ORDER.index(p["type"]) if p["type"] in ORDER else 99)
            print(c["name"])
            print("\n".join(edits))
        if all_backed and grid:
            c["applicationPlansProvenance"] = {
                "source": f"Common App requirements grid ({source['url']})",
                "year": "2026-27",
            }

    print(f"\n{schools_touched} schools changed: {changed} dates changed, {filled} blanks filled, {added} plans added.")
    if held_schools:
        print(f"\nHELD BACK, no edits made ({len(held_schools)} schools, check each against the school's own page):")
        for h in held_schools:
            print("  -", h)
    if notes:
        print("\nLeft alone (please review):")
        for n in notes:
            print("  -", n)

    if apply:
        out = json.dumps(colleges, indent=2, ensure_ascii=False) + ("\n" if trailing_newline else "")
        with open(colleges_path, "w", encoding="utf-8", newline="") as f:
            f.write(out)
        print("\nWrote data/colleges.json.")
    else:
        print("\nDry run: nothing written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
