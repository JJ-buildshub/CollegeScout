#!/usr/bin/env python3
"""
Applies data/reviewed-deadlines.json to data/colleges.json: replaces each listed
school's applicationPlans with the reviewed list and records the school's own
admissions page as applicationPlansProvenance.

DRY RUN by default (prints before/after for every school and writes nothing).
Pass --apply to write data/colleges.json. Only applicationPlans and
applicationPlansProvenance of the listed schools are ever changed; every other
byte of the file is preserved. Run scripts/check-reviewed-deadlines.mjs first to
confirm each quoted page line still appears on the live page.

    python scripts/apply-reviewed-deadlines.py            # show the diff
    python scripts/apply-reviewed-deadlines.py --apply    # write it
"""
import io
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def describe(plans):
    return "; ".join(f"{p['type']}{' (binding)' if p['binding'] else ''} {p['deadline'] or '(no date)'}" for p in plans) or "(none)"


def main():
    apply = "--apply" in sys.argv
    path = os.path.join(ROOT, "data", "colleges.json")
    raw = open(path, encoding="utf-8", newline="").read()
    trailing_newline = raw.endswith("\n")
    colleges = json.loads(raw)
    reviewed = json.load(open(os.path.join(ROOT, "data", "reviewed-deadlines.json"), encoding="utf-8"))
    by_id = {c["id"]: c for c in colleges}

    changed = 0
    for cid, entry in reviewed["schools"].items():
        c = by_id.get(cid)
        if c is None:
            print(f"!! {cid} is not in colleges.json")
            continue
        before = describe(c["applicationPlans"])
        after = describe(entry["plans"])
        same = c["applicationPlans"] == entry["plans"]
        print(f"{c['name']}\n  before: {before}\n  after:  {after}" + ("  (plans unchanged; source recorded)" if same else ""))
        if entry.get("note"):
            print(f"  note:   {entry['note']}")
        if not same:
            changed += 1
        c["applicationPlans"] = entry["plans"]
        c["applicationPlansProvenance"] = {"source": f"{entry['label']} ({entry['url']})", "year": reviewed["cycle"]}

    print(f"\n{len(reviewed['schools'])} schools reviewed, {changed} with changed plans.")
    if apply:
        out = json.dumps(colleges, indent=2, ensure_ascii=False) + ("\n" if trailing_newline else "")
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(out)
        print("Wrote data/colleges.json.")
    else:
        print("Dry run: nothing written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
